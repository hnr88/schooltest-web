'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { useCapabilitiesQuery } from '@/modules/ops/queries/use-capabilities.query';
import {
  serverFieldErrors,
  useUpdateOpsProfileMutation,
  useUpdatePlatformSettingsMutation,
} from '@/modules/ops/queries/use-update-platform-settings.mutation';
import { usePlatformSettingsQuery } from '@/modules/ops/queries/use-platform-settings.query';
import { platformSettingsFormSchema } from '@/modules/ops/schemas/platform-settings.schema';
import type {
  PlatformSettings,
  PlatformSettingsForm,
} from '@/modules/ops/types/platform-settings.types';

/** Server row -> form values. Nulls become empty strings; nothing is invented. */
function toFormValues(settings: PlatformSettings): PlatformSettingsForm {
  return {
    site_name: settings.site_name,
    site_tagline: settings.site_tagline ?? '',
    seo_default_title: settings.seo_default_title ?? '',
    seo_default_description: settings.seo_default_description ?? '',
    maintenance_mode: settings.maintenance_mode,
    maintenance_message: settings.maintenance_message ?? '',
    announcement_enabled: settings.announcement_enabled,
    announcement_message: settings.announcement_message ?? '',
    announcement_level: settings.announcement_level,
    session_timeout_minutes: settings.session_timeout_minutes,
    upload_max_size_mb: settings.upload_max_size_mb,
    pagination_default_page_size: settings.pagination_default_page_size,
    pagination_max_page_size: settings.pagination_max_page_size,
    email_provider: settings.email_provider,
    email_from_name: settings.email_from_name ?? '',
    email_from_address: settings.email_from_address ?? '',
    email_reply_to: settings.email_reply_to ?? '',
    rate_limit_auth_max: settings.rate_limit_auth_max,
    rate_limit_auth_window_ms: settings.rate_limit_auth_window_ms,
  };
}

/** Empty optional strings are sent as null so the column is cleared, not set to "". */
function toPatch(values: PlatformSettingsForm): Record<string, unknown> {
  const patch: Record<string, unknown> = { ...values };
  for (const key of [
    'site_tagline', 'seo_default_title', 'seo_default_description', 'maintenance_message',
    'announcement_message', 'email_from_name', 'email_from_address', 'email_reply_to',
  ]) {
    if (patch[key] === '') patch[key] = null;
  }
  return patch;
}

/**
 * C-SET-02/03 form state. The client schema mirrors the server's bounds, but the
 * SERVER stays the authority: its `details.errors[].path` entries are mapped
 * back onto the matching inputs, so a cross-field rule the client cannot express
 * (max page size below default) still lands on the right field.
 */
export function usePlatformSettingsForm() {
  const t = useTranslations('Ops.settings');
  const query = usePlatformSettingsQuery();
  const update = useUpdatePlatformSettingsMutation();

  // `values` is the ONLY hydration path on purpose. RHF re-applies it with
  // `keepFieldsRef: true`, so `control._fields` survives; a hand-written
  // `form.reset(...)` in an effect defaults to `keepFieldsRef: false`, wipes
  // `_fields`, and every later keystroke is silently dropped while the form
  // keeps submitting the server values.
  const form = useForm<PlatformSettingsForm>({
    resolver: zodResolver(platformSettingsFormSchema),
    values: query.data ? toFormValues(query.data) : undefined,
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await update.mutateAsync(toPatch(values));
      toast.success(t('savedToast'));
    } catch (error) {
      // 412 = the row changed since this form was hydrated (If-Match). The
      // DRAFT STAYS in the inputs: no field errors, and NO refetch — the
      // `values` hydration would silently clobber what the operator typed.
      if (isAxiosError(error) && error.response?.status === 412) {
        toast.error(t('staleToast'));
        return;
      }
      const fieldErrors = serverFieldErrors(error);
      for (const { path, message } of fieldErrors) {
        form.setError(path as keyof PlatformSettingsForm, { type: 'server', message });
      }
      toast.error(fieldErrors.length > 0 ? t('validationToast') : t('errorToast'));
    }
  });

  return { t, form, query, handleSubmit, isSaving: update.isPending };
}

// C-OPS-PORTAL-031 — the internal operations account card. Self-profile editing
// is the ONE write a read-only support account may perform, and the body is
// only ever these two names: the server resolves the user from the JWT alone
// and refuses email, role, school, blocked or password keys. The schema mirrors
// the server's bounds (trimmed 1..100); the server stays the authority.
const opsProfileFormSchema = z.object({
  first_name: z.string().trim().min(1).max(100),
  last_name: z.string().trim().min(1).max(100),
});

type OpsProfileForm = z.infer<typeof opsProfileFormSchema>;

export function useOpsProfileForm() {
  const t = useTranslations('Ops.settings.account');
  const query = useCapabilitiesQuery();
  const update = useUpdateOpsProfileMutation();

  // Same `values`-only hydration as the settings form above — a reset() would
  // wipe `_fields` and swallow later keystrokes.
  const form = useForm<OpsProfileForm>({
    resolver: zodResolver(opsProfileFormSchema),
    values: query.data
      ? {
          first_name: query.data.actor.first_name ?? '',
          last_name: query.data.actor.last_name ?? '',
        }
      : undefined,
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await update.mutateAsync(values);
      toast.success(t('savedToast'));
    } catch {
      toast.error(t('errorToast'));
    }
  });

  return { t, form, handleSubmit, isSaving: update.isPending };
}
