'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { Alert, Button, Skeleton } from '@/modules/design-system';
import { OpsOnboardSchoolDialog } from '@/modules/ops/components/OpsOnboardSchoolDialog';
import { useInvitationActions } from '@/modules/ops/hooks/use-invitation-actions';
import {
  onboardingEligibility,
  useOnboardingReadQuery,
} from '@/modules/ops/queries/use-onboarding-read.query';
import { useResendInvitationMutation } from '@/modules/ops/queries/use-resend-invitation.mutation';
import { useRevokeInvitationMutation } from '@/modules/ops/queries/use-revoke-invitation.mutation';

import type { OpsSchoolInvitationPanelProps } from '@/modules/ops/types/components.types';

/** The shared tone of every secondary control on this panel. */
const SECONDARY = { type: 'button', variant: 'outline', size: 'sm' } as const;

/**
 * The school's stored primary contact plus the invitation controls its onboarding
 * status allows (C-OPS-PORTAL-011): not_started -> send, link_sent -> Resend and
 * Revoke, anything later -> the regular staff flow. The two lifecycle columns stay
 * independent — `onboarding_status` drives the buttons because it is what the
 * server gates on; `account_status` is reported, never read as acceptance.
 */
export function OpsSchoolInvitationPanel({ documentId, enabled }: OpsSchoolInvitationPanelProps) {
  const t = useTranslations('Ops.onboard');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [staffInvitationEmail, setStaffInvitationEmail] = useState<string | null>(null);
  const invitation = useOnboardingReadQuery(documentId, enabled);
  const resend = useResendInvitationMutation();
  const revoke = useRevokeInvitationMutation();
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const actions = useInvitationActions({
    documentId,
    resend,
    revoke,
    onCooldown: (seconds) => setCooldownSeconds(seconds),
  });
  // Task 11: the client WAITS the server's Retry-After window out - a tick
  // decrements it, and Resend stays disabled while any window is open.
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => setCooldownSeconds((value) => Math.max(value - 1, 0)), 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  if (invitation.isPending) return <Skeleton className="h-10 w-64" />;
  if (invitation.isError) {
    const retry = () => void invitation.refetch();
    return (
      <Alert
        variant="error"
        title={t('loadError')}
        action={
          <Button {...SECONDARY} loading={invitation.isFetching} onClick={retry}>
            {t('retry')}
          </Button>
        }
      >
        {t('loadErrorDescription')}
      </Alert>
    );
  }

  const state = onboardingEligibility(invitation.data);
  if (state.mode === 'staff_invitation' && staffInvitationEmail) {
    return (
      <p className="text-sm text-body">{t('sentIndicator', { email: staffInvitationEmail })}</p>
    );
  }

  return (
    <>
      <dl
        data-slot="ops-invitation-contact"
        data-account-status={state.accountStatus ?? 'none'}
        data-onboarding-status={state.onboardingStatus ?? 'none'}
        className="flex flex-wrap items-baseline gap-x-2 text-sm"
      >
        <dt className="text-body">{t('primaryContact')}</dt>
        <dd data-field="primary-contact" className="mr-6 font-medium text-foreground">
          {state.contactName ?? t('contactMissing')}
        </dd>
        <dt className="text-body">{t('contactEmail')}</dt>
        <dd data-field="contact-email" className="font-medium text-foreground">
          {state.contactEmail ?? t('contactMissing')}
        </dd>
      </dl>
      {state.canSend ? (
        <div data-slot="ops-onboard-actions" className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={() => setDialogOpen(true)}>
            {t('button')}
          </Button>
        </div>
      ) : null}
      {state.mode === 'onboarding_pending' ? (
        <div
          data-slot="ops-onboard-actions"
          data-invitation="sent"
          className="flex flex-wrap items-center gap-x-4 gap-y-3"
        >
          <p className="text-sm text-body">
            {t('sentIndicator', { email: state.contactEmail ?? '' })}
          </p>
          <Button
            {...SECONDARY}
            disabled={!state.canResend || cooldownSeconds > 0}
            loading={resend.isPending}
            onClick={actions.resend}
          >
            {t('resend')}
          </Button>
          <Button {...SECONDARY} loading={revoke.isPending} onClick={actions.revoke}>
            {t('revoke')}
          </Button>
        </div>
      ) : null}
      {/* Mounted OUTSIDE the status branches: a successful send invalidates this
          query and flips the branch, and unmounting an open dialog would skip the
          primitive's close cleanup and leave the page's pointer-events locked. */}
      <OpsOnboardSchoolDialog
        schoolDocumentId={documentId}
        mode={state.mode === 'staff_invitation' ? 'staff_invitation' : 'onboarding'}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onInvited={state.mode === 'staff_invitation' ? setStaffInvitationEmail : undefined}
      />
    </>
  );
}
