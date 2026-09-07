'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { restFailureOf } from '@/lib/axios/strapi';
import { Button } from '@/modules/design-system';
import { useStaffResendInvitationMutation } from '@/modules/ops/queries/use-resend-invitation.mutation';
import { useStaffRevokeInvitationMutation } from '@/modules/ops/queries/use-revoke-invitation.mutation';

import type { StaffInvitationRow } from '@schooltest/ops-contracts';

interface OpsStaffInvitationRowActionsProps {
  row: StaffInvitationRow;
  /** Seconds left on the shared resend cooldown; 0 means the control is live. */
  cooldownSeconds: number;
  onCooldown: (seconds: number) => void;
}

// GAP-1 (task 15) — the per-row Resend / Revoke controls of the pictured
// invitations table. Eligibility mirrors the server: only a pending `invited`
// or lapsed `expired` row acts; `accepted` belongs to task 16's account
// actions and `revoked` is terminal. Resend honours the persisted cooldown —
// a 429 + Retry-After disables the control for exactly the window the server
// names (the axios boundary never auto-replays a POST) — and Revoke is
// offered on the invitation row only, never as a stand-in for removing an
// accepted account.
export function OpsStaffInvitationRowActions({
  row,
  cooldownSeconds,
  onCooldown,
}: OpsStaffInvitationRowActionsProps) {
  const t = useTranslations('Ops.staffInvitations');
  const resend = useStaffResendInvitationMutation();
  const revoke = useStaffRevokeInvitationMutation();

  if (row.status !== 'invited' && row.status !== 'expired') return null;

  const resendInvitation = async () => {
    try {
      await resend.mutateAsync(row.documentId);
      toast.success(t('staffResendSuccess', { email: row.email ?? '' }));
    } catch (error) {
      const failure = restFailureOf(error);
      if (failure?.kind === 'rate-limited') {
        const seconds = failure.retryAfterSeconds ?? 60;
        onCooldown(seconds);
        toast.error(t('staffResendCooldown', { seconds }));
        return;
      }
      toast.error(t('staffResendError'));
    }
  };

  const revokeInvitation = async () => {
    try {
      await revoke.mutateAsync(row.documentId);
      toast.success(t('staffRevokeSuccess', { email: row.email ?? '' }));
    } catch {
      toast.error(t('staffRevokeError'));
    }
  };

  return (
    <div
      data-slot="ops-staff-invitation-row-actions"
      data-row-status={row.status ?? 'unknown'}
      className="flex flex-wrap gap-2"
    >
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={cooldownSeconds > 0}
        loading={resend.isPending}
        onClick={() => void resendInvitation()}
      >
        {t('staffActionResend')}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        loading={revoke.isPending}
        onClick={() => void revokeInvitation()}
      >
        {t('staffActionRevoke')}
      </Button>
    </div>
  );
}
