'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import type { DirectoryRowAction } from '@/modules/directory';
import { showOpsToast } from '@/modules/ops/actions';
import { serverMessage } from '@/modules/teachers/lib/server-message';
import { useReissueInvitationMutation } from '@/modules/teachers/queries/use-reissue-invitation.mutation';
import { useRemoveTeacherMutation } from '@/modules/teachers/queries/use-remove-teacher.mutation';
import { useRevokeInvitationMutation } from '@/modules/teachers/queries/use-revoke-invitation.mutation';
import {
  useDeactivateTeacherMutation,
  useReactivateTeacherMutation,
} from '@/modules/teachers/queries/use-toggle-teacher.mutation';
import type { StaffRow } from '@/modules/teachers/types/teachers.types';

import type { StaffActionWarning } from '@/modules/teachers/types/components.types';
import type { StaffConfirmAction } from '@/modules/teachers/types/hooks.types';

/* ops/32 — mutation + toast wiring for the merged staff table's row actions,
 * now consumed by the shared directory kit's row menu (edit C-TCH-04, reissue
 * C-INV-03, revoke C-INV-04/07, deactivate/reactivate C-TCH-02, permanent
 * removal C-TCH-03). One core, two consumers:
 *
 * - useStaffTableActions (the kit table): holds the confirm/edit state at
 *   TABLE level — the kit renders the ⋯ menu itself, so no per-row component
 *   exists to own it — and builds the kit action list with explicit `write`
 *   flags (logic.md#c-row-actions: every staff action is mutating; D-20 says
 *   declared, never inferred). An invitation is not an account: its rows
 *   offer reissue/revoke only, dispatched on the ROW's own documentId.
 * - useStaffRowActions (legacy per-row shape, kept byte-compatible for the
 *   not-yet-retired StaffRowActions component): same core, row-scoped state.
 *
 * The confirm dialog still drives every destructive/reversible access change;
 * only a removal that really touches sittings or results is warned about
 * (C-RPT-04; an unknown count is never dressed up as a warning).
 */

// Inferred on purpose: next-intl's `t` is a namespace-keyed overloaded
// function — an explicit structural type here would either lie or fight it.
function useStaffActionRunners() {
  const t = useTranslations('Teachers.actions');
  const reissue = useReissueInvitationMutation();
  const revoke = useRevokeInvitationMutation();
  const deactivate = useDeactivateTeacherMutation();
  const reactivate = useReactivateTeacherMutation();
  const remove = useRemoveTeacherMutation();

  const nameOf = (row: StaffRow): string =>
    `${row.first_name} ${row.last_name}`.trim() || row.email;

  const reissueInvitation = async (row: StaffRow): Promise<void> => {
    try {
      await reissue.mutateAsync(row.documentId);
      showOpsToast({ tone: 'ok', message: t('reissuedToast', { email: row.email }) });
    } catch {
      showOpsToast({ tone: 'error', message: t('errorToast') });
    }
  };

  // Spec section 3: only a removal that really touches sittings or results is
  // warned about. `reportingClassCount` is null when C-RPT-04 could not be read,
  // and an unknown count is never dressed up as a warning.
  const warningOf = (
    action: StaffConfirmAction,
    row: StaffRow,
  ): StaffActionWarning | undefined =>
    action === 'remove' && row.reportingClassCount !== null && row.reportingClassCount > 0
      ? {
          title: t('removeReportingWarningTitle'),
          body: t('removeReportingWarning', { count: row.reportingClassCount }),
        }
      : undefined;

  const pendingOf = (action: StaffConfirmAction): boolean =>
    (action === 'revoke' && revoke.isPending) ||
    (action === 'deactivate' && deactivate.isPending) ||
    (action === 'reactivate' && reactivate.isPending) ||
    (action === 'remove' && remove.isPending);

  const runConfirmed = async (
    action: StaffConfirmAction,
    row: StaffRow,
  ): Promise<boolean> => {
    try {
      if (action === 'revoke') {
        await revoke.mutateAsync(row.documentId);
        showOpsToast({ tone: 'ok', message: t('revokedToast', { email: row.email }) });
      } else if (action === 'deactivate') {
        await deactivate.mutateAsync(row.documentId);
        showOpsToast({ tone: 'ok', message: t('deactivatedToast', { name: nameOf(row) }) });
      } else if (action === 'reactivate') {
        await reactivate.mutateAsync(row.documentId);
        showOpsToast({ tone: 'ok', message: t('reactivatedToast', { name: nameOf(row) }) });
      } else if (action === 'remove') {
        const result = await remove.mutateAsync(row.documentId);
        showOpsToast({
          tone: 'ok',
          message: t('removedToast', { name: nameOf(row), classes: result.classes_unassigned }),
        });
      }
      return true;
    } catch (error) {
      showOpsToast({ tone: 'error', message: serverMessage(error) ?? t('errorToast') });
      return false;
    }
  };

  return { t, nameOf, reissueInvitation, runConfirmed, warningOf, pendingOf };
}

export interface StaffConfirmRequest {
  action: StaffConfirmAction;
  row: StaffRow;
}

export interface StaffTableActions {
  /** The kit row-action list for one row, with declared `write` flags. */
  rowActionsFor: (row: StaffRow) => readonly DirectoryRowAction<StaffRow>[];
  /** The pending confirm, row included — an invitation documentId is not a user documentId. */
  confirm: StaffConfirmRequest | null;
  confirmWarning: StaffActionWarning | undefined;
  confirmPending: boolean;
  handleConfirm: () => Promise<void>;
  closeConfirm: () => void;
  editRow: StaffRow | null;
  closeEdit: () => void;
}

export function useStaffTableActions(): StaffTableActions {
  const core = useStaffActionRunners();
  const [confirm, setConfirm] = useState<StaffConfirmRequest | null>(null);
  const [editRow, setEditRow] = useState<StaffRow | null>(null);

  // A live account gets the spec's two icon buttons — edit (C-TCH-04) and
  // remove (C-TCH-03) — with the reversible access toggle (C-TCH-02) behind
  // the overflow menu. An open invitation has no account to edit or remove,
  // so its menu is reissue (C-INV-03) + revoke (C-INV-04/07) only. The kit
  // lists every action in the menu; `quick` is an inline shortcut, not a
  // filter, so the inline pair renders exactly the old cluster's order.
  const rowActionsFor = (row: StaffRow): readonly DirectoryRowAction<StaffRow>[] => {
    const name = core.nameOf(row);
    if (row.kind === 'invitation') {
      return [
        {
          label: core.t('reissue'),
          write: true,
          onSelect: (target) => {
            void core.reissueInvitation(target);
          },
        },
        {
          label: core.t('revoke'),
          destructive: true,
          write: true,
          onSelect: (target) => setConfirm({ action: 'revoke', row: target }),
        },
      ];
    }
    return [
      {
        label: core.t('editLabel', { name }),
        icon: Pencil,
        quick: true,
        write: true,
        onSelect: (target) => setEditRow(target),
      },
      {
        label: core.t('removeLabel', { name }),
        icon: Trash2,
        quick: true,
        destructive: true,
        write: true,
        onSelect: (target) => setConfirm({ action: 'remove', row: target }),
      },
      row.status === 'deactivated'
        ? {
            label: core.t('reactivate'),
            write: true,
            onSelect: (target) => setConfirm({ action: 'reactivate', row: target }),
          }
        : {
            label: core.t('deactivate'),
            destructive: true,
            write: true,
            onSelect: (target) => setConfirm({ action: 'deactivate', row: target }),
          },
    ];
  };

  const handleConfirm = async (): Promise<void> => {
    if (!confirm) return;
    const confirmed = await core.runConfirmed(confirm.action, confirm.row);
    // The dialog closes on SUCCESS only — a refused action stays open on the
    // same row, exactly as the per-row hook always behaved.
    if (confirmed) setConfirm(null);
  };

  return {
    rowActionsFor,
    confirm,
    confirmWarning: confirm ? core.warningOf(confirm.action, confirm.row) : undefined,
    confirmPending: confirm ? core.pendingOf(confirm.action) : false,
    handleConfirm,
    closeConfirm: () => setConfirm(null),
    editRow,
    closeEdit: () => setEditRow(null),
  };
}

// Legacy per-row shape — same public contract StaffRowActions has always
// consumed (that component is outside this task's write set and still
// compiles against it). The kit path above supersedes it; this shim exists so
// the tree carries exactly one copy of the mutation/toast wiring.
export function useStaffRowActions(row: StaffRow) {
  const core = useStaffActionRunners();
  const [confirmAction, setConfirmAction] = useState<StaffConfirmAction | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const name = core.nameOf(row);
  const confirmPending = confirmAction !== null && core.pendingOf(confirmAction);
  const confirmWarning: StaffActionWarning | undefined = confirmAction
    ? core.warningOf(confirmAction, row)
    : undefined;

  const handleReissue = async () => {
    await core.reissueInvitation(row);
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;
    const confirmed = await core.runConfirmed(confirmAction, row);
    if (confirmed) setConfirmAction(null);
  };

  return {
    t: core.t,
    name,
    confirmAction,
    setConfirmAction,
    confirmPending,
    confirmWarning,
    editOpen,
    setEditOpen,
    handleReissue,
    handleConfirm,
  };
}
