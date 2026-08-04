'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  serverFieldErrors,
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

  const form = useForm<PlatformSettingsForm>({
    resolver: zodResolver(platformSettingsFormSchema),
    values: query.data ? toFormValues(query.data) : undefined,
  });

  useEffect(() => {
    if (query.data) form.reset(toFormValues(query.data));
    // `form` is stable across renders; resetting on every render would fight typing.
  }, [query.data]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await update.mutateAsync(toPatch(values));
      toast.success(t('savedToast'));
    } catch (error) {
      const fieldErrors = serverFieldErrors(error);
      for (const { path, message } of fieldErrors) {
        form.setError(path as keyof PlatformSettingsForm, { type: 'server', message });
      }
      toast.error(fieldErrors.length > 0 ? t('validationToast') : t('errorToast'));
    }
  });

  return { t, form, query, handleSubmit, isSaving: update.isPending };
}
