'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Alert, Button, Skeleton } from '@/modules/design-system';
import { OpsOnboardSchoolDialog } from '@/modules/ops/components/OpsOnboardSchoolDialog';
import { useResendInvitationMutation } from '@/modules/ops/queries/use-resend-invitation.mutation';
import { useRevokeInvitationMutation } from '@/modules/ops/queries/use-revoke-invitation.mutation';
import { useSchoolInvitationQuery } from '@/modules/ops/queries/use-school-invitation.query';
import { useInvitationActions } from '@/modules/ops/hooks/use-invitation-actions';

interface OpsSchoolInvitationPanelProps {
  documentId: string;
  enabled: boolean;
}

/**
 * The spec's Onboard School control and its state table, driven by
 * `onboarding_status` alone — never by a client-side guess:
 *
 *   not_started -> the enabled "Onboard School" button
 *   link_sent   -> the invitation indicator plus Resend and Revoke
 *   anything else (the school admin is onboarding, or is onboarded) -> nothing
 *
 * Sits between the status badges and the summary cards, where the spec puts it.
 */
export function OpsSchoolInvitationPanel({ documentId, enabled }: OpsSchoolInvitationPanelProps) {
  const t = useTranslations('Ops.onboard');
  const [dialogOpen, setDialogOpen] = useState(false);
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

  return (
    <>
      {status === 'not_started' ? (
        <div data-slot="ops-onboard-actions" className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={() => setDialogOpen(true)}>
            {t('button')}
          </Button>
        </div>
      ) : null}

      {status === 'link_sent' ? (
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
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
