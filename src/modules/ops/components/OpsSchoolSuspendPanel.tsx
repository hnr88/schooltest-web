'use client';

import { MoreHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useRef, useState } from 'react';
import { formatResourceVersion, type PortalStatus } from '@schooltest/ops-contracts';

import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { restFailureOf, strapi } from '@/lib/axios/strapi';
import {
  Button,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconButton,
} from '@/modules/design-system';
import {
  OpsTypedNameConfirm,
  showOpsToast,
  typedNameMatches,
  useOpsActionRunner,
  useOpsWriteGate,
} from '@/modules/ops/actions';
import type { OpsActionDefinition, OpsActionTarget } from '@/modules/ops/actions';
import { OpsConfirmDialog } from '@/modules/ops/components/OpsConfirmDialog';
import {
  primarySchoolLifecycleAction,
  schoolLifecycleActions,
} from '@/modules/ops/lib/school-lifecycle-actions';
import type {
  SchoolLifecycleAction,
  SchoolLifecycleActionKey,
} from '@/modules/ops/lib/school-lifecycle-actions';
import { archiveSchool, suspendSchool } from '@/modules/ops/queries/use-school-suspend.mutation';
import { fetchSchoolDetail } from '@/modules/ops/queries/use-school-detail.query';
import { fetchSchoolVersion } from '@/modules/ops/queries/use-school-version.query';
import { useCapabilitiesQuery } from '@/modules/ops/queries/use-capabilities.query';
import {
  onboardingEligibility,
  useOnboardingReadQuery,
} from '@/modules/ops/queries/use-onboarding-read.query';
import { useRecalculateSeatsMutation } from '@/modules/ops/queries/use-school-recalculate-seats.mutation';
import { useRevokeInvitationMutation } from '@/modules/ops/queries/use-revoke-invitation.mutation';
import { useSchoolLifecycleUndoMutation } from '@/modules/ops/queries/use-school-lifecycle-undo.mutation';

import type { OpsSchoolSuspendPanelProps } from '@/modules/ops/types/school-suspend.types';

type PanelProps = OpsSchoolSuspendPanelProps & {
  portalStatus?: PortalStatus;
  onEdit?: () => void;
  onInvite?: () => void;
  onChanged?: () => void | Promise<void>;
};

type LifecycleActionKey = Exclude<SchoolLifecycleActionKey, 'editDetails' | 'inviteAdmin'>;

interface LifecycleTarget extends OpsActionTarget {
  lifecycleAction: LifecycleActionKey;
  targetStatus: PortalStatus;
}

interface ActionHandle {
  actionDocumentId: string;
}

function fallbackPortalStatus(
  accountStatus: OpsSchoolSuspendPanelProps['school']['account_status'],
): PortalStatus {
  if (accountStatus === 'closed') return 'archived';
  if (accountStatus === 'suspended') return 'suspended';
  return 'active';
}

/** The detail header's derived primary action and per-status overflow menu. */
export function OpsSchoolSuspendPanel({
  school,
  enabled,
  portalStatus,
  onEdit,
  onInvite,
  onChanged,
}: PanelProps) {
  const t = useTranslations('Ops.detail');
  // Reuses the invitation panel's own `Ops.onboard` copy verbatim (D-33) for
  // the ⋯ menu's Revoke entry, which reuses ITS mutation too (d-38/D-13).
  const tOnboard = useTranslations('Ops.onboard');
  const status = portalStatus ?? fallbackPortalStatus(school.account_status);
  const primary = primarySchoolLifecycleAction(status);
  const actions = schoolLifecycleActions(status);
  const capabilities = useCapabilitiesQuery(enabled);
  const writeGate = useOpsWriteGate();
  const undo = useSchoolLifecycleUndoMutation();
  const invitation = useOnboardingReadQuery(school.documentId, enabled);
  const canRevoke = invitation.data ? onboardingEligibility(invitation.data).canRevoke : false;
  const revokeInvitation = useRevokeInvitationMutation();
  const recalculateSeats = useRecalculateSeatsMutation();
  const actionHandle = useRef<ActionHandle | null>(null);
  const [selectedAction, setSelectedAction] = useState<SchoolLifecycleAction | null>(null);
  const [typedName, setTypedName] = useState('');

  const actionDefinition = useMemo<OpsActionDefinition<LifecycleTarget>>(
    () => ({
      write: true,
      async perform(target) {
        const version = await fetchSchoolVersion(target.documentId);
        const resourceVersion = formatResourceVersion(version.updatedAt);

        if (target.lifecycleAction === 'suspend') {
          const result = await suspendSchool({
            schoolDocumentId: target.documentId,
            version: resourceVersion,
          });
          actionHandle.current = {
            actionDocumentId: result.action_documentId,
          };
          return result;
        }

        if (target.lifecycleAction === 'archive') {
          const result = await archiveSchool({
            schoolDocumentId: target.documentId,
            version: resourceVersion,
          });
          actionHandle.current = {
            actionDocumentId: result.action_documentId,
          };
          return result;
        }

        if (target.lifecycleAction === 'restore') {
          const response = await strapi.post<unknown>(
            `/api/ops/schools/${target.documentId}/restore`,
            {},
            { opsPortalVersioned: true, headers: { 'If-Match': resourceVersion } },
          );
          return response.data;
        }

        if (target.lifecycleAction === 'activate' || target.lifecycleAction === 'reactivate') {
          const response = await strapi.post<unknown>(
            `/api/ops/schools/${target.documentId}/activate`,
            {},
            { opsPortalVersioned: true },
          );
          return response.data;
        }

        throw new Error(`Unsupported school lifecycle action: ${target.lifecycleAction}`);
      },
      async readBack(target) {
        return (await fetchSchoolDetail(target.documentId)).portal_status === target.targetStatus;
      },
      async isEligible(target) {
        return (await fetchSchoolDetail(target.documentId)).portal_status !== target.targetStatus;
      },
    }),
    [],
  );
  const runner = useOpsActionRunner(actionDefinition);
  const readOnly = capabilities.data?.capabilities.write === false;

  const actionCopy = (action: SchoolLifecycleAction) => {
    if (action.confirm === null) return null;
    return {
      title: t(action.confirm.titleKey, { name: school.name }),
      body: t(action.confirm.bodyKey),
      cta: t(action.confirm.ctaKey),
    };
  };

  const refuseNonLifecycleWrite = (): boolean => {
    const reason = writeGate.blockedReason();
    if (reason === null) return true;
    showOpsToast({ tone: 'error', message: reason });
    return false;
  };

  // Task 13: revoke re-parented from the invitation panel — same mutation,
  // same outcome, a second drawn entry point (retire-ledger.md#d-38).
  const runRevoke = async () => {
    if (!refuseNonLifecycleWrite()) return;
    try {
      await revokeInvitation.mutateAsync(school.documentId);
      showOpsToast({ tone: 'ok', message: tOnboard('revokeSuccess') });
    } catch {
      showOpsToast({ tone: 'error', message: tOnboard('revokeError') });
    }
  };

  // Task 13: real endpoint (C-OPSS-08) — recounts active students against the
  // school's entitlement row. No entitlement row is a genuine 404, surfaced
  // as an error, never a false success.
  const runRecalculateSeats = async () => {
    if (!refuseNonLifecycleWrite()) return;
    try {
      const result = await recalculateSeats.mutateAsync(school.documentId);
      showOpsToast({
        tone: 'ok',
        message: t('actions.recalculateSeatsSuccess', {
          used: result.seats_used,
          total: result.seats_total,
        }),
      });
    } catch {
      showOpsToast({ tone: 'error', message: t('actions.error') });
    }
  };

  const chooseAction = (action: SchoolLifecycleAction) => {
    if (action.key === 'editDetails') {
      if (refuseNonLifecycleWrite()) onEdit?.();
      return;
    }
    if (action.key === 'inviteAdmin') {
      if (refuseNonLifecycleWrite()) onInvite?.();
      return;
    }
    if (!refuseNonLifecycleWrite()) return;
    setTypedName('');
    setSelectedAction(action);
  };

  const runSelectedAction = async () => {
    if (selectedAction === null || selectedAction.targetStatus === undefined) return;
    const action = selectedAction;
    if (action.key === 'editDetails' || action.key === 'inviteAdmin') return;
    const lifecycleAction = action.key as LifecycleActionKey;
    const targetStatus = action.targetStatus;
    if (targetStatus === undefined) return;
    actionHandle.current = null;
    const summary = await runner.run([
      {
        kind: 'school',
        documentId: school.documentId,
        lifecycleAction,
        targetStatus,
      },
    ]);
    setSelectedAction(null);
    setTypedName('');

    if (!summary.allSucceeded) {
      showOpsToast({ tone: 'error', message: t('actions.error') });
      return;
    }

    await onChanged?.();
    const handle = actionHandle.current as ActionHandle | null;
    if (handle === null) {
      showOpsToast({ tone: 'ok', message: t('actions.success', { name: school.name }) });
      return;
    }

    showOpsToast({
      tone: 'ok',
      message: t('actions.success', { name: school.name }),
      action: {
        label: t('actions.undo'),
        run: async () => {
          try {
            const version = await fetchSchoolVersion(school.documentId);
            await undo.mutateAsync({
              schoolDocumentId: school.documentId,
              actionDocumentId: handle.actionDocumentId,
              version: formatResourceVersion(version.updatedAt),
            });
            await onChanged?.();
            showOpsToast({ tone: 'ok', message: t('actions.undoSuccess', { name: school.name }) });
          } catch (error) {
            const failure = restFailureOf(error);
            if (failure?.kind === 'contract' && failure.status === 410) {
              showOpsToast({ tone: 'warn', message: t('actions.undoExpired') });
              return;
            }
            showOpsToast({ tone: 'error', message: t('actions.error') });
          }
        },
      },
    });
  };

  const selectedCopy = selectedAction === null ? null : actionCopy(selectedAction);
  const isTyped = selectedAction?.typed === true;
  // The portal's ONE typed-name rule (`ops-typed-name`): NFC-normalise, trim,
  // collapse whitespace runs, case-fold. A raw `===` here was the one gate that
  // rejected a name the rest of the app accepts (autocapitalise, double space,
  // composed accents), so the typed Archive confirm was unreachable from this
  // surface for input every other typed-name confirm treats as a match.
  const nameOk = typedNameMatches(typedName, school.name);

  return (
    <div
      data-slot="ops-school-suspend"
      data-account-status={school.account_status}
      data-portal-status={status}
      className="flex flex-wrap items-center gap-3"
    >
      {/* pending_setup/trial have no server-reachable primary status action
          (activation happens through onboarding), so the navy slot is empty
          there and the ⋯ menu carries Edit/Invite/Archive. */}
      {primary === null ? null : (
        <span
          className="inline-flex"
          onClick={readOnly ? refuseNonLifecycleWrite : undefined}
          onKeyDown={readOnly ? refuseNonLifecycleWrite : undefined}
        >
          <Button
            type="button"
            variant="navy"
            className="h-11 rounded-full px-5 text-[13.5px] font-semibold"
            data-action={`primary-${primary.key}`}
            disabled={readOnly}
            onClick={readOnly ? undefined : () => chooseAction(primary)}
          >
            {t(primary.labelKey)}
          </Button>
        </span>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <IconButton
              icon={MoreHorizontal}
              label={t('actions.menuLabel')}
              className="size-11 rounded-full border-[#D8DFEA] hover:border-navy-900 hover:bg-card"
            />
          }
        />
        <DropdownMenuContent align="end" className="min-w-[236px]">
          {actions.map((action) => (
            <DropdownMenuItem
              key={action.key}
              variant={action.danger ? 'destructive' : 'default'}
              aria-disabled={readOnly && action.write ? true : undefined}
              className={`${action.danger ? 'text-destructive' : ''}${
                readOnly && action.write ? 'text-slate-400' : ''
              }`}
              onClick={() => chooseAction(action)}
            >
              {t(action.labelKey)}
            </DropdownMenuItem>
          ))}
          {canRevoke ? (
            <DropdownMenuItem
              aria-disabled={readOnly ? true : undefined}
              className={readOnly ? 'text-slate-400' : ''}
              onClick={() => void runRevoke()}
            >
              {tOnboard('revoke')}
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem
            aria-disabled={readOnly ? true : undefined}
            className={readOnly ? 'text-slate-400' : ''}
            onClick={() => void runRecalculateSeats()}
          >
            {t('actions.recalculateSeats')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {selectedCopy === null || isTyped ? null : (
        <OpsConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open && !runner.state.inFlight) setSelectedAction(null);
          }}
          title={selectedCopy.title}
          description={selectedCopy.body}
          confirmLabel={selectedCopy.cta}
          cancelLabel={t('actions.cancel')}
          tone={selectedAction?.danger ? 'destructive' : 'neutral'}
          pending={runner.state.status === 'running'}
          onConfirm={() => void runSelectedAction()}
        />
      )}
      {selectedCopy === null || !isTyped ? null : (
        <OpsTypedNameConfirm
          open
          onOpenChange={(open) => {
            if (!open && !runner.state.inFlight) setSelectedAction(null);
          }}
          title={selectedCopy.title}
          description={selectedCopy.body}
          requiredName={school.name}
          typedName={typedName}
          onTypedNameChange={setTypedName}
          canConfirm={nameOk}
          errorMessage={
            typedName.length === 0 || nameOk ? null : t('suspend.archiveNameMismatch')
          }
          confirmLabel={selectedCopy.cta}
          cancelLabel={t('actions.cancel')}
          pending={runner.state.status === 'running'}
          onConfirm={() => void runSelectedAction()}
        />
      )}
    </div>
  );
}
