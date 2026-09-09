'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { MailWarning } from 'lucide-react';

import {
  applyClientDirectoryMode,
  DirectoryTable,
  useDirectoryState,
  type DirectoryColumnDef,
  type DirectoryFilterDef,
  type DirectoryLabels,
  type DirectoryRowAction,
  type DirectorySortDef,
} from '@/modules/directory';
import { StatusPill } from '@/modules/design-system';
import { useFlagEmailFixMutation } from '@/modules/teach/queries/use-flag-email-fix.mutation';
import {
  rosterClientConfig,
  rosterFilters,
  rosterSorts,
} from '@/modules/teach/lib/roster-directory.lib';
import { rosterDisplayName } from '@/modules/teach/lib/roster-table.helpers';

import type { RosterTableProps } from '@/modules/teach/types/components.types';
import type { RosterChild } from '@/modules/teach/types/roster.types';

// ops/33 — the C-CHD-01 roster rendered THROUGH the shared directory kit in
// `client` mode (the endpoint takes no list params). The kit owns search, the
// status filter, sort, the URL round-trip and the loading/empty/error states;
// this file owns the pictured columns and the C-CHD-05 email-fix action as a
// kit row action (`write: true`, quick, from the existing mutation with its
// own guard + toasts). The "Fix requested" badge rides the email cell, so the
// pending state stays on the row it belongs to.

export function RosterTable({ rows, query }: RosterTableProps) {
  const t = useTranslations('Teach.roster');
  const { flagEmailFix, isFlagged, pendingDocumentId } = useFlagEmailFixMutation();

  const filters = useMemo<readonly DirectoryFilterDef[]>(
    () =>
      rosterFilters({
        label: t('filterStatusLabel'),
        all: t('filterStatusAll'),
        active: t('statusActive'),
        archived: t('statusArchived'),
      }),
    [t],
  );
  const sorts = useMemo<readonly DirectorySortDef[]>(
    () => rosterSorts({ asc: t('sortNameAsc'), desc: t('sortNameDesc') }),
    [t],
  );

  const state = useDirectoryState({
    filters,
    sorts,
    defaultSort: 'name:asc',
    mode: 'client',
    // The roster query fetches the C-CHD-01 contract maximum, and the design
    // draws the class list as one scroll — not a paged grid.
    pageSize: 100,
  });
  const page = useMemo(
    () => applyClientDirectoryMode(rows, state.params, rosterClientConfig),
    [rows, state.params],
  );

  const labels = useMemo<Partial<DirectoryLabels>>(
    () => ({
      searchPlaceholder: t('searchPlaceholder'),
      searchLabel: t('searchLabel'),
      sortLabel: t('sortLabel'),
      clearFilters: t('clearFilters'),
      paginationLabel: t('paginationLabel'),
      previous: t('previous'),
      next: t('next'),
      rowMenuLabel: t('rowMenuLabel'),
      showingCount: ({ showing, total }) => t('showingCount', { showing, total }),
      pageCount: ({ page, pageCount, total }) => t('pageCount', { page, pageCount, total }),
      emptyNoneTitle: t('emptyTitle'),
      emptyNoneDescription: t('emptyBody'),
      emptyNoMatchesTitle: t('filteredEmptyTitle'),
      emptyNoMatchesDescription: t('filteredEmptyDescription'),
      errorTitle: t('loadError'),
      errorStaleBanner: t('errorStaleBanner'),
      errorDescription: t('errorDescription'),
      retry: t('retry'),
      loadingLabel: t('loading'),
    }),
    [t],
  );

  const columns = useMemo<DirectoryColumnDef<RosterChild>[]>(
    () => [
      {
        key: 'name',
        header: t('columnName'),
        cell: (row) => <span className="font-medium text-foreground">{rosterDisplayName(row)}</span>,
        sortable: true,
        sortValues: { asc: 'name:asc', desc: 'name:desc' },
      },
      {
        key: 'status',
        header: t('columnStatus'),
        cell: (row) => (
          <StatusPill tone={row.status === 'active' ? 'success' : 'neutral'}>
            {row.status === 'active' ? t('statusActive') : t('statusArchived')}
          </StatusPill>
        ),
      },
      {
        key: 'email',
        header: t('columnEmail'),
        cell: (row) => <EmailCell row={row} flagLabel={t('emailFixPending')} missingLabel={t('emailMissing')} isFlagged={isFlagged} />,
      },
    ],
    [t, isFlagged],
  );

  const rowActions = (row: RosterChild): readonly DirectoryRowAction<RosterChild>[] => {
    const flagged =
      row.email_fix_requested || isFlagged(row.documentId) || pendingDocumentId === row.documentId;
    if (flagged) return [];
    return [
      {
        label: t('emailFixAction'),
        icon: MailWarning,
        quick: true,
        write: true,
        onSelect: () => flagEmailFix(row.documentId),
      },
    ];
  };

  return (
    <div data-slot="teach-roster-table">
      <DirectoryTable
        state={state}
        query={query}
        rows={page.rows}
        meta={page.meta}
        getRowKey={(row) => row.documentId}
        filters={filters}
        sorts={sorts}
        columns={columns}
        rowActions={rowActions}
        labels={labels}
      />
    </div>
  );
}

function EmailCell({
  row,
  flagLabel,
  missingLabel,
  isFlagged,
}: {
  row: RosterChild;
  flagLabel: string;
  missingLabel: string;
  isFlagged: (documentId: string) => boolean;
}) {
  const pending = row.email_fix_requested || isFlagged(row.documentId);
  return (
    <span className="flex flex-wrap items-center gap-2">
      {row.email ? <span>{row.email}</span> : <StatusPill tone="warning">{missingLabel}</StatusPill>}
      {pending ? <StatusPill tone="info">{flagLabel}</StatusPill> : null}
    </span>
  );
}
