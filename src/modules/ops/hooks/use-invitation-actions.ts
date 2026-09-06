'use client';

import type { UseMutationResult } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { restFailureOf } from '@/lib/axios/strapi';
import type {
  OnboardingLinkResult,
  RevokeInvitationResult,
} from '@/modules/ops/types/school-invitation.types';

import type { UseInvitationActionsInput } from '@/modules/ops/types/hooks.types';

/**
 * C-SCH-05 / C-SCH-06 click handling for the invitation panel — the toasts and
 * the error path, kept out of the component so it stays presentational.
 */
export function useInvitationActions({
  documentId,
  resend,
  revoke,
  onCooldown,
}: UseInvitationActionsInput & {
  /** Receives the server's Retry-After seconds; the panel disables the control. */
  onCooldown?: (seconds: number) => void;
}) {
  const t = useTranslations('Ops.onboard');

  return {
    async resend() {
      try {
        const result = await resend.mutateAsync(documentId);
        toast.success(t('resendSuccess', { email: result.contact.email }));
      } catch (error) {
        // Task 11: the server's persisted cooldown answers 429 + Retry-After.
        // The client WAITS it out - the boundary never auto-replays a POST.
        const failure = restFailureOf(error);
        if (failure?.kind === 'rate-limited') {
          const seconds = failure.retryAfterSeconds ?? 60;
          onCooldown?.(seconds);
          toast.error(t('resendCooldown', { seconds }));
          return;
        }
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
