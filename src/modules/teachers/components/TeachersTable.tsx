'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

import { useAuthStore } from '@/modules/auth';
import {
  applyClientDirectoryMode,
  DIRECTORY_ALL,
  DirectoryTable,
  useDirectoryState,
  type DirectoryColumnDef,
  type DirectoryFilterDef,
  type DirectoryLabels,
  type DirectoryQueryStatus,
  type DirectorySortDef,
} from '@/modules/directory';
import { ConfirmStaffActionDialog } from '@/modules/teachers/components/ConfirmStaffActionDialog';
import { EditTeacherDialog } from '@/modules/teachers/components/EditTeacherDialog';
import { StaffClassesCell, StaffNameCell } from '@/modules/teachers/components/StaffTableRow';
import { useStaffTableActions } from '@/modules/teachers/hooks/use-staff-row-actions';
import {
  staffDirectoryClientConfig,
  useStaffRows,
} from '@/modules/teachers/hooks/use-staff-rows';
import { useInvitationsQuery } from '@/modules/teachers/queries/use-invitations.query';
import { useTeachersQuery } from '@/modules/teachers/queries/use-teachers.query';

import type { TeachersTableProps } from '@/modules/teachers/types/components.types';
import type { StaffRow } from '@/modules/teachers/types/teachers.types';

// ops/32 — the merged staff table (C-TCH-01 accounts + C-INV-02 open
// invitations) rendered THROUGH the shared directory kit in `client` mode:
// `/api/schools/me/teachers` and `/api/schools/me/invitations` return
// unpaginated collections (D-27), so search (name + email), the design's
// three-way status chips (Active · Invited · Suspended, derived per
// logic.md#sm-staff from `blocked` plus the open invitation), the name sort
// and the pager all reduce the rows `useStaffRows` already merged — the kit
// takes presentation only, and a filter can never drop invitations, because
// it is applied to the MERGED list, never to one query.
//
// The query status rides the same two react-query hooks the screen uses (same
// keys, so no second fetch); the confirm + edit dialogs mount once here,
// addressed by row, because the kit owns the row menu and there is no
// per-row component left to hold that state.
export function TeachersTable({ rows }: TeachersTableProps) {
  const t = useTranslations('Teachers');
  const td = useTranslations('Teachers.table');
  const ta = useTranslations('Teachers.actions');
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const enabled = hydrated && Boolean(token);
  const teachersQuery = useTeachersQuery(enabled);
  const invitationsQuery = useInvitationsQuery(enabled);

  const query = useMemo<DirectoryQueryStatus>(
    () => ({
      isPending: teachersQuery.isPending || invitationsQuery.isPending,
      isError: teachersQuery.isError || invitationsQuery.isError,
      isFetching: teachersQuery.isFetching || invitationsQuery.isFetching,
      refetch: () => {
        void teachersQuery.refetch();
        void invitationsQuery.refetch();
      },
      error: teachersQuery.error ?? invitationsQuery.error,
      enabled,
    }),
    [teachersQuery, invitationsQuery, enabled],
  );

  const filters = useMemo<readonly DirectoryFilterDef[]>(
    () => [
      {
        key: 'status',
        label: td('columnStatus'),
        options: [
          { value: DIRECTORY_ALL, label: td('filterAll') },
          { value: 'active', label: td('statusActive') },
          { value: 'invited', label: td('statusInvited') },
          { value: 'suspended', label: td('statusSuspended') },
        ],
      },
    ],
    [td],
  );

  const sorts = useMemo<readonly DirectorySortDef[]>(
    () => [
      { value: 'name:asc', label: td('sortNameAsc') },
      { value: 'name:desc', label: td('sortNameDesc') },
    ],
    [td],
  );

  const state = useDirectoryState({
    filters,
    sorts,
    defaultSort: 'name:asc',
    mode: 'client',
  });

  const page = useMemo(
    () => applyClientDirectoryMode(rows, state.params, staffDirectoryClientConfig),
    [rows, state.params],
  );

  const labels = useMemo<Partial<DirectoryLabels>>(
    () => ({
      searchPlaceholder: td('searchPlaceholder'),
      searchLabel: td('searchLabel'),
      sortLabel: td('sortLabel'),
      clearFilters: td('clearFilters'),
      paginationLabel: td('paginationLabel'),
      previous: td('previous'),
      next: td('next'),
      rowMenuLabel: td('rowMenuLabel'),
      showingCount: ({ showing, total }) => td('showingCount', { showing, total }),
      pageCount: ({ page, pageCount, total }) => td('pageCount', { page, pageCount, total }),
      emptyNoneTitle: td('emptyTitle'),
      emptyNoneDescription: td('emptyBody'),
      emptyNoMatchesTitle: td('noMatchesTitle'),
      emptyNoMatchesDescription: td('noMatchesBody'),
      errorTitle: t('errorTitle'),
      errorStaleBanner: td('staleBanner'),
      errorDescription: t('errorDescription'),
      retry: t('retry'),
      loadingLabel: td('loading'),
    }),
    [t, td],
  );

  const columns = useMemo<readonly DirectoryColumnDef<StaffRow>[]>(
    () => [
      {
        key: 'name',
        header: td('columnName'),
        cell: (row) => <StaffNameCell row={row} />,
        sortable: true,
        sortValues: { asc: 'name:asc', desc: 'name:desc' },
      },
      {
        key: 'email',
        header: td('columnEmail'),
        cell: (row) => row.email,
      },
      {
        key: 'classes',
        header: td('columnClasses'),
        cell: (row) => <StaffClassesCell row={row} />,
      },
    ],
    [td],
  );

  const actions = useStaffTableActions();
  const confirm = actions.confirm;
  const confirmName = confirm ? nameOf(confirm.row) : '';

  return (
    <div data-slot="school-staff-table">
      <DirectoryTable
        state={state}
        query={query}
        rows={page.rows}
        meta={page.meta}
        getRowKey={(row) => `${row.kind}-${row.documentId}`}
        filters={filters}
        sorts={sorts}
        columns={columns}
        rowActions={actions.rowActionsFor}
        labels={labels}
        chipFilterKey="status"
        rowAttrs={(row) => ({ 'data-status': row.status })}
      />
      <ConfirmStaffActionDialog
        open={confirm !== null}
        onOpenChange={(open) => {
          if (!open) actions.closeConfirm();
        }}
        title={confirm ? ta(`${confirm.action}Title`, { name: confirmName }) : ''}
        description={confirm ? ta(`${confirm.action}Description`) : ''}
        warning={actions.confirmWarning}
        cancelLabel={ta('cancel')}
        confirmLabel={confirm ? ta(`${confirm.action}Confirm`) : ''}
        destructive={confirm?.action !== 'reactivate'}
        pending={actions.confirmPending}
        onConfirm={() => {
          void actions.handleConfirm();
        }}
      />
      {actions.editRow ? (
        <EditTeacherDialog row={actions.editRow} onClose={actions.closeEdit} />
      ) : null}
    </div>
  );
}

function nameOf(row: StaffRow): string {
  return `${row.first_name} ${row.last_name}`.trim() || row.email;
}
