'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { useCapabilitiesQuery } from '@/modules/ops/queries/use-capabilities.query';
import { useUpdateOpsProfileMutation } from '@/modules/ops/queries/use-update-platform-settings.mutation';

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

  // Same `values`-only hydration the retired platform-settings form used — a
  // reset() would wipe `_fields` and swallow later keystrokes.
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
