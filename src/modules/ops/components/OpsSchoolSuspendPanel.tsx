'use client';

import { MoreHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useRef, useState } from 'react';
import { formatResourceVersion, type PortalStatus } from '@schooltest/ops-contracts';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { restFailureOf, strapi } from '@/lib/axios/strapi';
import { IconButton, Button } from '@/modules/design-system';
import {
  OpsTypedNameConfirm,
  showOpsToast,
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
  const status = portalStatus ?? fallbackPortalStatus(school.account_status);
  const primary = primarySchoolLifecycleAction(status);
  const actions = schoolLifecycleActions(status);
  const capabilities = useCapabilitiesQuery(enabled);
  const writeGate = useOpsWriteGate();
  const undo = useSchoolLifecycleUndoMutation();
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
  const typedNameMatches = typedName.trim() === school.name;

  return (
    <div
      data-slot="ops-school-suspend"
      data-account-status={school.account_status}
      data-portal-status={status}
      className="flex flex-wrap items-center gap-3"
    >
      <span
        className="inline-flex"
        onClick={readOnly ? refuseNonLifecycleWrite : undefined}
        onKeyDown={readOnly ? refuseNonLifecycleWrite : undefined}
      >
        <Button
          type="button"
          variant={primary.danger ? 'destructive' : 'default'}
          size="sm"
          data-action={`primary-${primary.key}`}
          disabled={readOnly}
          onClick={readOnly ? undefined : () => chooseAction(primary)}
        >
          {t(primary.labelKey)}
        </Button>
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<IconButton icon={MoreHorizontal} label={t('actions.menuLabel')} size="sm" />}
        />
        <DropdownMenuContent align="end">
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
          canConfirm={typedNameMatches}
          errorMessage={
            typedName.length === 0 || typedNameMatches ? null : t('suspend.archiveNameMismatch')
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
