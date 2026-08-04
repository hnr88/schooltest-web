'use client';

import type { UseMutationResult } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import type {
  OnboardingLinkResult,
  RevokeInvitationResult,
} from '@/modules/ops/types/school-invitation.types';

import type { UseInvitationActionsInput } from '@/modules/ops/types/hooks.types';

/**
 * C-SCH-05 / C-SCH-06 click handling for the invitation panel — the toasts and
 * the error path, kept out of the component so it stays presentational.
 */
export function useInvitationActions({ documentId, resend, revoke }: UseInvitationActionsInput) {
  const t = useTranslations('Ops.onboard');

  return {
    async resend() {
      try {
        const result = await resend.mutateAsync(documentId);
        toast.success(t('resendSuccess', { email: result.contact.email }));
      } catch {
        toast.error(t('resendError'));
      }
    },
    async revoke() {
      try {
        await revoke.mutateAsync(documentId);
        toast.success(t('revokeSuccess'));
      } catch {
        toast.error(t('revokeError'));
      }
    },
  };
}
