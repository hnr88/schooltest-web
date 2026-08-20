'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Alert, Button, Skeleton } from '@/modules/design-system';
import { OpsOnboardSchoolDialog } from '@/modules/ops/components/OpsOnboardSchoolDialog';
import { useResendInvitationMutation } from '@/modules/ops/queries/use-resend-invitation.mutation';
import { useRevokeInvitationMutation } from '@/modules/ops/queries/use-revoke-invitation.mutation';
import { useSchoolInvitationQuery } from '@/modules/ops/queries/use-school-invitation.query';
import { useInvitationActions } from '@/modules/ops/hooks/use-invitation-actions';
import { getOpsSchoolAdminInviteMode } from '@/modules/ops/lib/ops-school-admin-invite';

import type { OpsSchoolInvitationPanelProps } from '@/modules/ops/types/components.types';

/**
 * School-admin invitation controls, driven by the server's onboarding status:
 *
 *   not_started -> send the initial onboarding invitation
 *   link_sent   -> the invitation indicator plus Resend and Revoke
 *   anything else -> invite a school admin through the regular staff flow
 *
 * Sits between the status badges and the summary cards.
 */
export function OpsSchoolInvitationPanel({ documentId, enabled }: OpsSchoolInvitationPanelProps) {
  const t = useTranslations('Ops.onboard');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [staffInvitationEmail, setStaffInvitationEmail] = useState<string | null>(null);
  const invitation = useSchoolInvitationQuery(documentId, enabled);
  const resend = useResendInvitationMutation();
  const revoke = useRevokeInvitationMutation();
  const actions = useInvitationActions({ documentId, resend, revoke });

  if (invitation.isPending) return <Skeleton className="h-10 w-64" />;

  if (invitation.isError) {
    return (
      <Alert
        variant="error"
        title={t('loadError')}
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={invitation.isFetching}
            onClick={() => invitation.refetch()}
          >
            {t('retry')}
          </Button>
        }
      >
        {t('loadErrorDescription')}
      </Alert>
    );
  }

  const status = invitation.data.onboarding_status;
  const mode = getOpsSchoolAdminInviteMode(status);

  if (mode === 'staff_invitation' && staffInvitationEmail) {
    return (
      <p className="text-sm text-body">{t('sentIndicator', { email: staffInvitationEmail })}</p>
    );
  }

  return (
    <>
      {mode !== 'onboarding_pending' ? (
        <div data-slot="ops-onboard-actions" className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={() => setDialogOpen(true)}>
            {t('button')}
          </Button>
        </div>
      ) : null}

      {mode === 'onboarding_pending' ? (
        <div
          data-slot="ops-onboard-actions"
          data-invitation="sent"
          className="flex flex-wrap items-center gap-x-4 gap-y-3"
        >
          <p className="text-sm text-body">
            {t('sentIndicator', { email: invitation.data.contact_email ?? '' })}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={resend.isPending}
            onClick={actions.resend}
          >
            {t('resend')}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={revoke.isPending}
            onClick={actions.revoke}
          >
            {t('revoke')}
          </Button>
        </div>
      ) : null}

      {/* Mounted OUTSIDE the status branches on purpose: a successful send
          invalidates this query and flips the branch, and unmounting a dialog
          that is still open would skip the primitive's close cleanup and leave
          the page's pointer-events locked. */}
      <OpsOnboardSchoolDialog
        schoolDocumentId={documentId}
        mode={mode === 'staff_invitation' ? 'staff_invitation' : 'onboarding'}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onInvited={mode === 'staff_invitation' ? setStaffInvitationEmail : undefined}
      />
    </>
  );
}
