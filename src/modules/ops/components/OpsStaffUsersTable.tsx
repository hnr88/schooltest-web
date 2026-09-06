'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { staffRowId, type StaffUserRow } from '@schooltest/ops-contracts';

import { Badge } from '@/modules/design-system';
import {
  DIRECTORY_ALL,
  OpsDirectoryTable,
  useOpsDirectoryState,
  type DirectoryColumnDef,
  type DirectoryFilterDef,
} from '@/modules/ops/directory';
import { noValueIfMissing } from '@/modules/ops/lib/ops-class-detail.helpers';
import { useStaffUsersQuery } from '@/modules/ops/queries/use-staff-users.query';

import type { OpsStaffUsersTableProps } from '@/modules/ops/types/components.types';

/** The server applies these; the client never filters or sorts a loaded page. */
const SORTS = [{ value: 'name:asc', label: 'Name' }] as const;

/**
 * C-OPS-PORTAL-015 — one directory for both people tabs (Admins:
 * role=school_admin, Teachers: role=teacher), now on the task 04 kit.
 *
 * The local table, pager, skeleton, error alert and empty state this replaced
 * were a fourth re-implementation of the kit's job. What stays here is what is
 * genuinely domain-specific: the columns, and the discriminated row identity.
 *
 * Row identity is `user:<documentId>` from the shared `staffRowId`, so a
 * pending-invitation row (C-OPS-PORTAL-016) can join the same list without two
 * different records colliding on one key when their name and email match. An
 * accepted invitation is NOT rendered here at all — the user row wins and the
 * terminal invitation stays in its own history list, so one person can never
 * appear twice as active.
 *
 * `blocked` is the only filter offered, and the server applies it: a suspended
 * account is still a real account, so hiding it client-side would make the
 * total disagree with the rows.
 */
export function OpsStaffUsersTable({
  schoolDocumentId,
  role,
  enabled,
  emptyTitle,
  emptyDescription,
  classCounts,
}: OpsStaffUsersTableProps) {
  const t = useTranslations('Ops.schoolTables');
  const format = useFormatter();

  const filters: readonly DirectoryFilterDef[] = useMemo(
    () => [
      {
        key: 'blocked',
        label: t('columnStatus'),
        options: [
          { value: DIRECTORY_ALL, label: t('statusAll') },
          { value: 'false', label: t('statusActive') },
          { value: 'true', label: t('statusSuspended') },
        ],
      },
    ],
    [t],
  );

  const state = useOpsDirectoryState({ filters, sorts: SORTS, defaultSort: 'name:asc' });

  const blockedFilter = state.params.filters.blocked;
  const query = useStaffUsersQuery(
    {
      schoolDocumentId,
      role,
      page: state.params.page,
      q: state.params.q,
      blocked: blockedFilter === undefined ? undefined : blockedFilter === 'true',
    },
    enabled,
  );

  const columns: readonly DirectoryColumnDef<StaffUserRow>[] = useMemo(
    () => [
      {
        key: 'name',
        header: t('columnName'),
        cell: (row) => (
          <span className="font-medium text-foreground">{noValueIfMissing(row.display_name)}</span>
        ),
      },
      { key: 'email', header: t('columnEmail'), cell: (row) => noValueIfMissing(row.email) },
      ...(classCounts
        ? [
            {
              key: 'classes',
              header: t('columnClasses'),
              cell: (row: StaffUserRow) => String(classCounts[row.documentId] ?? 0),
            },
          ]
        : []),
      {
        key: 'specialty',
        header: t('columnSpecialty'),
        cell: (row) => noValueIfMissing(row.teaching_specialty),
      },
      {
        key: 'last_active_at',
        header: t('columnLastActive'),
        // Never derived from createdAt: an account that has not signed in since
        // the column existed genuinely has no activity, and saying so is the
        // honest answer.
        cell: (row) =>
          row.last_active_at === null
            ? t('lastActiveUnavailable')
            : format.dateTime(new Date(row.last_active_at), { dateStyle: 'medium' }),
      },
      {
        key: 'status',
        header: t('columnStatus'),
        cell: (row) => (
          <Badge variant={row.blocked ? 'error' : 'default'}>
            {row.blocked ? t('statusSuspended') : t('statusActive')}
          </Badge>
        ),
      },
    ],
    [classCounts, format, t],
  );

  return (
    <OpsDirectoryTable
      state={state}
      query={query}
      rows={query.data?.data ?? []}
      // The discriminated identity, not the bare documentId: `user:<id>` can
      // never collide with `invitation:<id>` for the same person.
      getRowTarget={(row) => ({
        kind: 'staff-user',
        documentId: staffRowId({ kind: 'user', documentId: row.documentId }),
      })}
      meta={query.data?.meta.pagination}
      filters={filters}
      sorts={SORTS}
      columns={columns}
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
  );
}
