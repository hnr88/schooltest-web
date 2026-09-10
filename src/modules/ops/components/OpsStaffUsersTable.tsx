'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import {
  staffRowId,
  type StaffInvitationRow,
  type StaffInvitationsQuery,
  type StaffUserRole,
  type StaffUserRow,
} from '@schooltest/ops-contracts';

import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  SelectField,
} from '@/modules/design-system';
import {
  downloadOpsFile,
  showOpsToast,
  useOpsActionRunner,
  useOpsWriteGate,
  type OpsActionTarget,
} from '@/modules/ops/actions';
import { OpsConfirmDialog } from '@/modules/ops/components/OpsConfirmDialog';
import {
  DIRECTORY_ALL,
  OpsDirectoryTable,
  useOpsDirectoryState,
  type DirectoryBulkAction,
  type DirectoryColumnDef,
  type DirectoryFilterDef,
  type DirectoryRowAction,
} from '@/modules/ops/directory';
import { noValueIfMissing } from '@/modules/ops/lib/ops-class-detail.helpers';
import {
  staffAccountBulkActions,
  staffAccountRowActions,
  type StaffAccountStatus,
  type StaffRowAction,
} from '@/modules/ops/lib/staff-actions';
import { resendStaffInvitation } from '@/modules/ops/queries/use-resend-invitation.mutation';
import { revokeStaffInvitation } from '@/modules/ops/queries/use-revoke-invitation.mutation';
import {
  STAFF_USER_BLOCK_ACTION,
  STAFF_USER_REMOVE_ACTION,
  STAFF_USER_UNBLOCK_ACTION,
  staffInvitationResendAction,
  staffInvitationRevokeAction,
  staffUserSetRoleAction,
} from '@/modules/ops/queries/use-staff-user-actions.mutation';
import {
  OPS_STAFF_INVITATIONS_QUERY_KEY,
  useStaffInvitationsQuery,
} from '@/modules/ops/queries/use-staff-invitations.query';
import { staffUsersSchoolKey, useStaffUsersQuery } from '@/modules/ops/queries/use-staff-users.query';

import type { OpsStaffUsersTableProps } from '@/modules/ops/types/components.types';

/** The server applies these; the client never filters or sorts a loaded page. */
const SORTS = [{ value: 'name:asc', label: 'Name' }] as const;

/** The sentinel the merged status chip uses for the pending-invitation arm.
 * Kept on the SAME `blocked`-named filter/URL param as `'true'`/`'false'`
 * (never a new param key) because `OpsSchoolTables.tsx` — not this task's file
 * — already clears `blocked` on every tab change; a differently-named param
 * would silently survive a tab switch and leak a stale filter. */
const STATUS_INVITED = 'invited';

/** One admin surface only reaches invitations: 'ops'/'parent'/'student' never do. */
function invitationRoleOf(role: StaffUserRole): 'school_admin' | 'teacher' | null {
  return role === 'school_admin' || role === 'teacher' ? role : null;
}

/**
 * The merged row: an ACCEPTED account (C-OPS-PORTAL-015) or a PENDING
 * invitation (C-OPS-PORTAL-016) — one list, one discriminated identity
 * (`staffRowId`), so the two can never collide and an accepted invitation is
 * never rendered twice.
 */
type StaffDirectoryRow =
  | { kind: 'user'; row: StaffUserRow }
  | { kind: 'invitation'; row: StaffInvitationRow };

function rowTarget(row: StaffDirectoryRow): OpsActionTarget {
  return { kind: row.kind, documentId: row.row.documentId };
}

function rowIdentity(row: StaffDirectoryRow): string {
  return staffRowId({ kind: row.kind, documentId: row.row.documentId });
}

function toDirectoryAction(
  action: StaffRowAction,
  label: string,
  onSelect: () => void,
): DirectoryRowAction<StaffDirectoryRow> {
  return { label, write: action.write, destructive: action.danger, onSelect };
}

/**
 * C-OPS-PORTAL-015 — one directory for both people tabs (Admins:
 * role=school_admin, Teachers: role=teacher), now on the task 04 kit.
 *
 * task 15: the Admins tab's five row actions and four bulk actions
 * (`logic.md#c-row-actions`, `#c-bulk`), plus the merged Invited chip. An
 * ACCEPTED user's actions come from the shared `staffAccountRowActions`
 * table; a PENDING invitation's (Edit access reopens the invite dialog,
 * Resend, Revoke) are wired here directly, off the invitation actions task 19
 * already ships (`use-{resend,revoke}-invitation.mutation.ts`) — they are not
 * part of the shared table because Teachers (task 16) never merges
 * invitations into its own table.
 *
 * `blocked` is the filter key on the wire and in the URL; its FOUR values are
 * `''` (all), `'false'` (active), `'true'` (suspended) and `'invited'` — the
 * fourth switches the query source entirely, to C-OPS-PORTAL-016, since there
 * is no single endpoint that answers both.
 */
export function OpsStaffUsersTable({
  schoolDocumentId,
  role,
  enabled,
  emptyTitle,
  emptyDescription,
  classCounts,
  ownership,
  headerTitle,
  onInvite,
}: OpsStaffUsersTableProps & { headerTitle?: string; onInvite?: () => void }) {
  const t = useTranslations('Ops.schoolTables');
  const tInvitations = useTranslations('Ops.staffInvitations');
  const format = useFormatter();
  const queryClient = useQueryClient();
  const writeGate = useOpsWriteGate();
  const surface = role === 'teacher' ? 'teacher' : 'admin';
  const invitationRole = invitationRoleOf(role);
  // task 15 is the Admins tab only. `OpsTeachersTab.tsx` still calls this
  // component today (task 16 has not yet migrated it onto the dedicated
  // kit table) and passes neither prop — every merged-invitation behaviour
  // below (chip, header, row/bulk menus) is gated on this so that existing
  // call site renders BYTE-IDENTICAL to before this task.
  const isAdmins = headerTitle !== undefined;

  const refuseIfBlocked = (): boolean => {
    const reason = writeGate.blockedReason();
    if (reason === null) return false;
    showOpsToast({ tone: 'error', message: reason });
    return true;
  };

  const filters: readonly DirectoryFilterDef[] = useMemo(
    () => [
      {
        key: 'blocked',
        label: t('columnStatus'),
        options: [
          { value: DIRECTORY_ALL, label: t('statusAll') },
          { value: 'false', label: t('statusActive') },
          // Admins only: Teachers keeps its original three options
          // byte-identical, since it has no merged-invitation view yet.
          ...(isAdmins ? [{ value: STATUS_INVITED, label: t('statusInvited') }] : []),
          { value: 'true', label: t('statusSuspended') },
        ],
      },
    ],
    [t, isAdmins],
  );

  const state = useOpsDirectoryState({ filters, sorts: SORTS, defaultSort: 'name:asc' });
  const statusFilter = state.params.filters.blocked;
  const showingInvited = isAdmins && statusFilter === STATUS_INVITED;

  const usersQuery = useStaffUsersQuery(
    {
      schoolDocumentId,
      role,
      page: state.params.page,
      q: state.params.q,
      blocked: statusFilter === 'true' ? true : statusFilter === 'false' ? false : undefined,
    },
    enabled && !showingInvited,
  );

  const invitationsParams: StaffInvitationsQuery = useMemo(
    () => ({
      school: schoolDocumentId,
      ...(invitationRole ? { role: invitationRole } : {}),
      status: 'invited',
      page: state.params.page,
      ...(state.params.q ? { q: state.params.q } : {}),
    }),
    [schoolDocumentId, invitationRole, state.params.page, state.params.q],
  );
  // A SEPARATE, unfiltered-by-status params object for read-back: the table's
  // own `invitationsParams` filters `status: 'invited'` so the display never
  // shows history, but a revoke's whole PROOF is that the row now reads
  // `revoked` — querying with that same filter would exclude the very row
  // being verified and report every revoke as unproven forever.
  const invitationVerifyParams: StaffInvitationsQuery = useMemo(
    () => ({
      school: schoolDocumentId,
      ...(invitationRole ? { role: invitationRole } : {}),
    }),
    [schoolDocumentId, invitationRole],
  );
  const invitationsQuery = useStaffInvitationsQuery(
    invitationsParams,
    enabled && showingInvited && invitationRole !== null,
  );

  // The header summary ("N invited · M active") reads the SAME query keys the
  // table itself uses at those filter values, so react-query serves it from
  // cache once either arm has been visited instead of a third, wasted fetch.
  // Admins only: Teachers renders no header and never needs these totals.
  const activeCountQuery = useStaffUsersQuery(
    { schoolDocumentId, role, page: 1, blocked: false },
    enabled && isAdmins,
  );
  const invitedCountQuery = useStaffInvitationsQuery(
    {
      school: schoolDocumentId,
      ...(invitationRole ? { role: invitationRole } : {}),
      status: 'invited',
      page: 1,
    },
    enabled && isAdmins && invitationRole !== null,
  );
  const headerSummary = t('adminsHeaderSummary', {
    invited: invitedCountQuery.data?.meta.pagination.total ?? 0,
    active: activeCountQuery.data?.meta.pagination.total ?? 0,
  });

  const invalidateAccounts = () => queryClient.invalidateQueries({ queryKey: staffUsersSchoolKey(schoolDocumentId) });
  const invalidateInvitations = () =>
    queryClient.invalidateQueries({ queryKey: OPS_STAFF_INVITATIONS_QUERY_KEY });

  /* ---------------------------- account actions ---------------------------- */

  const blockRunner = useOpsActionRunner(STAFF_USER_BLOCK_ACTION);
  const unblockRunner = useOpsActionRunner(STAFF_USER_UNBLOCK_ACTION);
  const removeUserRunner = useOpsActionRunner(STAFF_USER_REMOVE_ACTION);

  const [confirmState, setConfirmState] = useState<{ row: StaffUserRow; action: StaffRowAction } | null>(
    null,
  );
  const confirmPending =
    blockRunner.state.status === 'running' ||
    unblockRunner.state.status === 'running' ||
    removeUserRunner.state.status === 'running';

  const confirmAccountAction = async () => {
    if (confirmState === null) return;
    const target: OpsActionTarget = { kind: 'user', documentId: confirmState.row.documentId };
    const name = confirmState.row.display_name ?? confirmState.row.email ?? '';
    const summary =
      confirmState.action.key === 'suspend'
        ? await blockRunner.run([target])
        : confirmState.action.key === 'reactivate'
          ? await unblockRunner.run([target])
          : await removeUserRunner.run([target]);
    setConfirmState(null);
    if (!summary.allSucceeded) {
      showOpsToast({ tone: 'error', message: t('errorDescription') });
      return;
    }
    await invalidateAccounts();
    showOpsToast({ tone: 'ok', message: t('accountActionSuccess', { name }) });
  };

  /* ----------------------------- edit access -------------------------------- */

  const [editRow, setEditRow] = useState<StaffUserRow | null>(null);
  const [editRole, setEditRole] = useState<StaffUserRole>('school_admin');
  const setRoleAction = useMemo(() => staffUserSetRoleAction(editRole), [editRole]);
  const setRoleRunner = useOpsActionRunner(setRoleAction);

  const openEditAccess = (row: StaffUserRow) => {
    if (refuseIfBlocked()) return;
    setEditRole(row.role === 'teacher' ? 'teacher' : 'school_admin');
    setEditRow(row);
  };

  const confirmEditAccess = async () => {
    if (editRow === null) return;
    const summary = await setRoleRunner.run([{ kind: 'user', documentId: editRow.documentId }]);
    setEditRow(null);
    if (!summary.allSucceeded) {
      showOpsToast({ tone: 'error', message: t('editAccessError') });
      return;
    }
    await invalidateAccounts();
    showOpsToast({
      tone: 'ok',
      message: t('editAccessSuccess', { name: editRow.display_name ?? editRow.email ?? '' }),
    });
  };

  /* --------------------------- invitation actions --------------------------- */

  const resendAction = useMemo(
    () => staffInvitationResendAction(resendStaffInvitation, invitationVerifyParams),
    [invitationVerifyParams],
  );
  const revokeAction = useMemo(
    () => staffInvitationRevokeAction(revokeStaffInvitation, invitationVerifyParams),
    [invitationVerifyParams],
  );
  const resendRunner = useOpsActionRunner(resendAction);
  const revokeRunner = useOpsActionRunner(revokeAction);

  const resendInvitation = async (invitation: StaffInvitationRow) => {
    if (refuseIfBlocked()) return;
    try {
      await resendRunner.run([{ kind: 'invitation', documentId: invitation.documentId }]);
      await invalidateInvitations();
      showOpsToast({ tone: 'ok', message: tInvitations('staffResendSuccess', { email: invitation.email ?? '' }) });
    } catch {
      showOpsToast({ tone: 'error', message: tInvitations('staffResendError') });
    }
  };

  const revokeInvitation = async (invitation: StaffInvitationRow) => {
    if (refuseIfBlocked()) return;
    await revokeRunner.run([{ kind: 'invitation', documentId: invitation.documentId }]);
    await invalidateInvitations();
    showOpsToast({ tone: 'ok', message: tInvitations('staffRevokeSuccess', { email: invitation.email ?? '' }) });
  };

  /* -------------------------------- export ---------------------------------- */

  const runExport = async () => {
    try {
      await downloadOpsFile({
        url: '/api/ops/users/export.csv',
        expectedType: 'text/csv',
        fallbackFilename: 'users.csv',
        params: new URLSearchParams({
          school: schoolDocumentId,
          role,
          ...(state.params.q ? { q: state.params.q } : {}),
          ...(statusFilter === 'true' ? { blocked: 'true' } : statusFilter === 'false' ? { blocked: 'false' } : {}),
        }),
      });
    } catch {
      showOpsToast({ tone: 'error', message: t('errorDescription') });
    }
  };

  /* ------------------------------ row actions -------------------------------- */

  const rowActions = (row: StaffDirectoryRow): readonly DirectoryRowAction<StaffDirectoryRow>[] => {
    if (row.kind === 'invitation') {
      const invitation = row.row;
      if (invitation.status !== 'invited' && invitation.status !== 'expired') return [];
      return [
        {
          label: t('actions.editAccess'),
          write: true,
          onSelect: () => {
            if (refuseIfBlocked()) return;
            onInvite?.();
          },
        },
        {
          label: t('actions.resendInvite'),
          write: true,
          onSelect: () => void resendInvitation(invitation),
        },
        {
          label: tInvitations('staffActionRevoke'),
          write: true,
          destructive: true,
          onSelect: () => void revokeInvitation(invitation),
        },
      ];
    }
    const user = row.row;
    const status: StaffAccountStatus = user.blocked ? 'suspended' : 'active';
    const actions = staffAccountRowActions(surface, status).map((action) => {
      if (action.key === 'editAccess') {
        return toDirectoryAction(action, t(action.labelKey), () => openEditAccess(user));
      }
      return toDirectoryAction(action, t(action.labelKey), () => {
        if (refuseIfBlocked()) return;
        setConfirmState({ row: user, action });
      });
    });
    // C-OPS-PORTAL-027 — Make owner, the design's third row action
    // (`:1306`), between Edit access and Suspend/Reactivate. Never offered
    // for the current owner or a suspended row (the server would refuse
    // both), and a transfer already in flight ignores a second click rather
    // than firing a concurrent one — the same guard the ownership column's
    // `disabled` button gave, expressed as a no-op since the kit's row menu
    // has no disabled affordance of its own.
    if (ownership && !user.blocked && ownership.ownerDocumentId !== user.documentId) {
      actions.splice(1, 0, {
        label: t('makeOwner'),
        write: true,
        onSelect: () => {
          if (refuseIfBlocked()) return;
          if (ownership.pendingDocumentId !== null) return;
          ownership.onMakeOwner(user);
        },
      });
    }
    return actions;
  };

  /* ----------------------------- bulk actions -------------------------------- */

  const [bulkConfirm, setBulkConfirm] = useState<{ key: 'suspend' | 'remove'; targets: readonly OpsActionTarget[] } | null>(
    null,
  );
  const [accountBulkSuspend, accountBulkRemove] = staffAccountBulkActions(surface);

  const confirmBulkAction = async () => {
    if (bulkConfirm === null) return;
    if (bulkConfirm.key === 'suspend') {
      const summary = await blockRunner.run(bulkConfirm.targets);
      setBulkConfirm(null);
      if (!summary.allSucceeded) showOpsToast({ tone: 'error', message: t('errorDescription') });
      await invalidateAccounts();
      return;
    }
    const userTargets = bulkConfirm.targets.filter((target) => target.kind === 'user');
    const invitationTargets = bulkConfirm.targets.filter((target) => target.kind === 'invitation');
    const [userSummary, invitationSummary] = await Promise.all([
      removeUserRunner.run(userTargets),
      revokeRunner.run(invitationTargets),
    ]);
    setBulkConfirm(null);
    if (!userSummary.allSucceeded || !invitationSummary.allSucceeded) {
      showOpsToast({ tone: 'error', message: t('errorDescription') });
    }
    await Promise.all([invalidateAccounts(), invalidateInvitations()]);
  };

  // `DirectoryTableBaseProps.bulkActions` is NOT threaded through the table's
  // own `Row` generic (unlike `rowActions`) — it is pinned to
  // `DirectoryBulkAction<unknown>`, the same reason every other bulk-action
  // consumer in this codebase (`OpsSchoolsTable.tsx`) never types `row` at
  // all. `eligible` narrows its own `unknown` parameter internally instead.
  const bulkActions: readonly DirectoryBulkAction[] = [
    {
      label: t('bulkResendInvites'),
      write: true,
      eligible: (row) => {
        const staffRow = row as StaffDirectoryRow;
        return staffRow.kind === 'invitation' && (staffRow.row.status === 'invited' || staffRow.row.status === 'expired');
      },
      onRun: (_rows, targets) => {
        if (refuseIfBlocked()) return;
        void resendRunner.run(targets).then(async (summary) => {
          await invalidateInvitations();
          if (!summary.allSucceeded) showOpsToast({ tone: 'error', message: t('errorDescription') });
        });
      },
    },
    {
      label: t('bulkExport'),
      write: false,
      onRun: () => void runExport(),
    },
    {
      label: t(accountBulkSuspend.labelKey),
      destructive: true,
      write: true,
      eligible: (row) => {
        const staffRow = row as StaffDirectoryRow;
        return staffRow.kind === 'user' && !staffRow.row.blocked;
      },
      onRun: (_rows, targets) => {
        if (refuseIfBlocked()) return;
        setBulkConfirm({ key: 'suspend', targets });
      },
    },
    {
      label: t(accountBulkRemove.labelKey),
      destructive: true,
      write: true,
      onRun: (_rows, targets) => {
        if (refuseIfBlocked()) return;
        setBulkConfirm({ key: 'remove', targets });
      },
    },
  ];

  /* -------------------------------- columns ---------------------------------- */

  const columns: readonly DirectoryColumnDef<StaffDirectoryRow>[] = useMemo(
    () => [
      {
        key: 'name',
        header: t('columnName'),
        cell: (row) => (
          <span className="font-medium text-foreground">{noValueIfMissing(row.row.display_name)}</span>
        ),
      },
      { key: 'email', header: t('columnEmail'), cell: (row) => noValueIfMissing(row.row.email) },
      ...(classCounts
        ? [
            {
              key: 'classes',
              header: t('columnClasses'),
              cell: (row: StaffDirectoryRow) => String(classCounts[row.row.documentId] ?? 0),
            },
          ]
        : []),
      {
        key: 'specialty',
        header: t('columnSpecialty'),
        cell: (row) => noValueIfMissing(row.kind === 'user' ? row.row.teaching_specialty : null),
      },
      {
        key: 'last_active_at',
        header: t('columnLastActive'),
        cell: (row) => {
          const lastActive = row.kind === 'user' ? row.row.last_active_at : null;
          return lastActive === null
            ? t('lastActiveUnavailable')
            : format.dateTime(new Date(lastActive), { dateStyle: 'medium' });
        },
      },
      {
        key: 'status',
        header: t('columnStatus'),
        cell: (row) =>
          row.kind === 'invitation' ? (
            <Badge variant="outline">{t('statusInvited')}</Badge>
          ) : (
            <Badge variant={row.row.blocked ? 'error' : 'default'}>
              {row.row.blocked ? t('statusSuspended') : t('statusActive')}
            </Badge>
          ),
      },
      // C-OPS-PORTAL-027 — present only when the caller supplies `ownership`.
      // Make owner now lives in the row menu (design `:1306`); the column
      // still carries the Owner badge, unaffected by that move.
      ...(ownership
        ? [
            {
              key: 'ownership',
              header: t('columnOwnership'),
              cell: (row: StaffDirectoryRow) =>
                row.kind === 'user' && ownership.ownerDocumentId === row.row.documentId ? (
                  <Badge variant="accent">{t('ownerBadge')}</Badge>
                ) : null,
            },
          ]
        : []),
    ],
    [classCounts, format, ownership, t],
  );

  const editAccessOptions = [
    { value: 'school_admin', label: t('editAccessRoleAdmin') },
    { value: 'teacher', label: t('editAccessRoleTeacher') },
  ];

  return (
    <>
      <OpsDirectoryTable
        state={state}
        query={
          showingInvited
            ? {
                isPending: invitationsQuery.isPending,
                isError: invitationsQuery.isError,
                isFetching: invitationsQuery.isFetching,
                refetch: invitationsQuery.refetch,
                error: invitationsQuery.error,
                enabled: enabled && invitationRole !== null,
                isPlaceholderData: invitationsQuery.isPlaceholderData,
              }
            : {
                isPending: usersQuery.isPending,
                isError: usersQuery.isError,
                isFetching: usersQuery.isFetching,
                refetch: usersQuery.refetch,
                error: usersQuery.error,
                enabled,
                isPlaceholderData: usersQuery.isPlaceholderData,
              }
        }
        rows={
          showingInvited
            ? (invitationsQuery.data?.data ?? []).map((row): StaffDirectoryRow => ({ kind: 'invitation', row }))
            : (usersQuery.data?.data ?? []).map((row): StaffDirectoryRow => ({ kind: 'user', row }))
        }
        getRowTarget={rowTarget}
        getRowKey={rowIdentity}
        rowAttrs={(row) => ({ 'data-row-id': rowIdentity(row) })}
        meta={showingInvited ? invitationsQuery.data?.meta.pagination : usersQuery.data?.meta.pagination}
        filters={filters}
        chipFilterKey={isAdmins ? 'blocked' : undefined}
        sorts={SORTS}
        columns={columns}
        selectable={isAdmins}
        rowActions={isAdmins ? rowActions : undefined}
        bulkActions={isAdmins ? bulkActions : undefined}
        header={
          isAdmins
            ? {
                title: headerTitle,
                summary: headerSummary,
                // No `label`: the design's "Export CSV" is the kit's own
                // default fallback (`DesignSystem.directory.exportCsv`) for
                // the header's secondary slot; the bulk bar's "Export"
                // (below) is a shorter, separately-drawn label at `:1470`.
                //
                // No `primary`: the design's Invite admin lives at
                // `OpsAdminsTab.tsx`'s own `data-testid="ops-admins-invite"`
                // control instead of this slot — see the comment there.
                secondary: { write: false, onSelect: () => void runExport() },
              }
            : undefined
        }
        emptyCopy={isAdmins ? { title: emptyTitle, body: emptyDescription } : undefined}
        labels={{
          searchPlaceholder: t('searchPlaceholder'),
          searchLabel: t('searchLabel'),
          emptyNoneTitle: emptyTitle,
          emptyNoneDescription: emptyDescription,
          emptyNoMatchesTitle: t('noMatches'),
          errorTitle: t('errorTitle'),
          errorDescription: t('errorDescription'),
          retry: t('retry'),
        }}
      />

      {confirmState === null || confirmState.action.confirm === null ? null : (
        <OpsConfirmDialog
          open
          onOpenChange={(open) => (open ? null : setConfirmState(null))}
          title={t(confirmState.action.confirm.titleKey, {
            name: confirmState.row.display_name ?? confirmState.row.email ?? '',
          })}
          description={t(confirmState.action.confirm.bodyKey)}
          confirmLabel={t(confirmState.action.confirm.ctaKey)}
          cancelLabel={t('makeOwnerCancel')}
          tone={confirmState.action.danger ? 'destructive' : 'neutral'}
          pending={confirmPending}
          onConfirm={() => void confirmAccountAction()}
        />
      )}

      {bulkConfirm === null
        ? null
        : (() => {
            const table = bulkConfirm.key === 'suspend' ? accountBulkSuspend : accountBulkRemove;
            const count = bulkConfirm.targets.length;
            return (
              <OpsConfirmDialog
                open
                onOpenChange={(open) => (open ? null : setBulkConfirm(null))}
                title={t(table.confirm.titleKey, { count })}
                description={t(table.confirm.bodyKey)}
                confirmLabel={t(table.confirm.ctaKey, { count })}
                cancelLabel={t('makeOwnerCancel')}
                tone="destructive"
                pending={blockRunner.state.status === 'running' || removeUserRunner.state.status === 'running' || revokeRunner.state.status === 'running'}
                onConfirm={() => void confirmBulkAction()}
              />
            );
          })()}

      <Dialog open={editRow !== null} onOpenChange={(open) => (open ? null : setEditRow(null))}>
        <DialogContent data-slot="ops-edit-access-dialog">
          <DialogHeader>
            <DialogTitle>
              {t('editAccessTitle', { name: editRow?.display_name ?? editRow?.email ?? '' })}
            </DialogTitle>
            <DialogDescription>{t('editAccessDescription')}</DialogDescription>
          </DialogHeader>
          <SelectField
            id="ops-edit-access-role"
            label={t('columnRole')}
            placeholder={t('columnRole')}
            options={editAccessOptions}
            value={editRole}
            onValueChange={(value) => setEditRole(value === 'teacher' ? 'teacher' : 'school_admin')}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditRow(null)}>
              {t('editAccessCancel')}
            </Button>
            <Button type="button" loading={setRoleRunner.state.status === 'running'} onClick={() => void confirmEditAccess()}>
              {t('editAccessSave')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
