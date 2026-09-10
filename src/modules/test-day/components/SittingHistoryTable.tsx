'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
import { SquareArrowOutUpRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useRouter } from '@/i18n/navigation';
import {
  applyClientDirectoryMode,
  DIRECTORY_ALL,
  DirectoryTable,
  useDirectoryState,
  type DirectoryClientConfig,
  type DirectoryColumnDef,
  type DirectoryFilterDef,
  type DirectoryLabels,
  type DirectoryRowAction,
  type DirectorySortDef,
} from '@/modules/directory';
import { StatusPill } from '@/modules/design-system';
import { OPENED_AT_PATTERN } from '@/modules/test-day/constants/components.constants';
import { useSittingHistoryQuery } from '@/modules/test-day/queries/use-sitting-history.query';

import type { SittingHistoryTableProps } from '@/modules/test-day/types/components.types';
import type { SittingHistoryRow } from '@/modules/test-day/types/sitting-history.types';

// C-SIT-07 sitting history (task 131, mvp-updates 4.5/4.6) rendered THROUGH the
// shared directory kit (ops/35) in `client` mode. The kit owns search, the
// outcome filter, the date sorts, the pager and the states; the rows render as
// before — newest first, with joined/submitted counts so staggered and
// catch-up sittings stay visible after they close.
//
// Design/data notes (the one-line disagreement records, ops/33 precedent):
// - "search by student" is unservable on C-SIT-07 — a history row is a
//   SITTING, carrying counts, never student names — so `q` searches the row's
//   real text (form code + sitting code). Nothing invented.
// - "quick action = open the sitting": this app's sitting surface is the
//   class's test-day console (one URL per class; the console resolves the
//   current sitting — D-27, presentation only, no per-sitting route exists to
//   invent). The action navigates there, `write: false`.
//
// The test-day screen hosts TWO kit lists (the live monitor above and this
// history), so this instance prefixes its URL params and preserves the
// monitor's keys — one list's write never drops the sibling's params
// (ops/34's cross-instance rule).

const HISTORY_PREFIX = 'history-';
const SIBLING_PREFIX = 'monitor-';
/** A class's sitting count grows slowly; the pager exists past the ceiling. */
const HISTORY_PAGE_SIZE = 100;

const openedAtOf = (row: SittingHistoryRow): number | null =>
  row.opened_at === null ? null : Date.parse(row.opened_at);

// Honest-absence rule (ops/33/34 doctrine): a sitting that was never opened
// has no date — it ranks LAST in BOTH directions, never as epoch 0.
const byOpenedDesc = (a: SittingHistoryRow, b: SittingHistoryRow): number => {
  const aAt = openedAtOf(a);
  const bAt = openedAtOf(b);
  if (aAt === null && bAt === null) return a.documentId.localeCompare(b.documentId);
  if (aAt === null) return 1;
  if (bAt === null) return -1;
  return bAt - aAt || a.documentId.localeCompare(b.documentId);
};

const byOpenedAsc = (a: SittingHistoryRow, b: SittingHistoryRow): number => {
  const aAt = openedAtOf(a);
  const bAt = openedAtOf(b);
  if (aAt === null && bAt === null) return a.documentId.localeCompare(b.documentId);
  if (aAt === null) return 1;
  if (bAt === null) return -1;
  return aAt - bAt || a.documentId.localeCompare(b.documentId);
};

const historyClientConfig: DirectoryClientConfig<SittingHistoryRow> = {
  searchText: (row) => [row.form_code ?? '', row.code ?? ''].filter(Boolean),
  filterPredicates: {
    status: (row, value) => row.status === value,
  },
  comparators: {
    'opened:desc': byOpenedDesc,
    'opened:asc': byOpenedAsc,
  },
};

export function SittingHistoryTable({ classDocumentId }: SittingHistoryTableProps) {
  const t = useTranslations('Teach.testDay.history');
  const router = useRouter();
  const history = useSittingHistoryQuery(classDocumentId);

  const filters = useMemo<readonly DirectoryFilterDef[]>(
    () => [
      {
        key: 'status',
        label: t('filterOutcomeLabel'),
        options: [
          { value: DIRECTORY_ALL, label: t('filterOutcomeAll') },
          { value: 'open', label: t('status.open') },
          { value: 'closed', label: t('status.closed') },
        ],
      },
    ],
    [t],
  );

  const sorts = useMemo<readonly DirectorySortDef[]>(
    () => [
      { value: 'opened:desc', label: t('sortOpenedDesc') },
      { value: 'opened:asc', label: t('sortOpenedAsc') },
    ],
    [t],
  );

  const state = useDirectoryState({
    filters,
    sorts,
    defaultSort: 'opened:desc',
    mode: 'client',
    pageSize: HISTORY_PAGE_SIZE,
    paramPrefix: HISTORY_PREFIX,
    preserveParams: [
      `${SIBLING_PREFIX}q`,
      `${SIBLING_PREFIX}sort`,
      `${SIBLING_PREFIX}page`,
      `${SIBLING_PREFIX}status`,
    ],
  });

  const page = useMemo(
    () => applyClientDirectoryMode(history.data ?? [], state.params, historyClientConfig),
    [history.data, state.params],
  );

  const labels = useMemo<Partial<DirectoryLabels>>(
    () => ({
      searchPlaceholder: t('searchPlaceholder'),
      searchLabel: t('searchLabel'),
      filtersLabel: t('filterOutcomeLabel'),
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

  const columns = useMemo<DirectoryColumnDef<SittingHistoryRow>[]>(
    () => [
      {
        key: 'opened',
        header: t('columns.opened'),
        cell: (row) =>
          row.opened_at ? format(new Date(row.opened_at), OPENED_AT_PATTERN) : t('missingValue'),
        sortable: true,
        sortValues: { asc: 'opened:asc', desc: 'opened:desc' },
      },
      {
        key: 'code',
        header: t('columns.code'),
        cell: (row) => row.code ?? t('missingValue'),
      },
      {
        key: 'form',
        header: t('columns.form'),
        cell: (row) => row.form_code ?? t('missingValue'),
      },
      {
        key: 'status',
        header: t('columns.status'),
        cell: (row) => (
          <StatusPill tone={row.status === 'open' ? 'success' : 'neutral'}>
            {t(`status.${row.status}`)}
          </StatusPill>
        ),
      },
      {
        key: 'joined',
        header: t('columns.joined'),
        cell: (row) => t('joinedCount', { joined: row.joined, total: row.total }),
      },
      {
        key: 'submitted',
        header: t('columns.submitted'),
        cell: (row) => t('submittedCount', { submitted: row.submitted, total: row.total }),
      },
    ],
    [t],
  );

  const rowActions = (): readonly DirectoryRowAction<SittingHistoryRow>[] => [
    {
      label: t('openAction'),
      icon: SquareArrowOutUpRight,
      quick: true,
      write: false,
      onSelect: () => router.push(`/dashboard/teach/classes/${classDocumentId}/test-day`),
    },
  ];

  return (
    <section className="flex flex-col gap-3" aria-label={t('title')}>
      <h2 className="text-lg font-semibold text-foreground">{t('title')}</h2>
      <DirectoryTable
        state={state}
        query={history}
        rows={page.rows}
        meta={page.meta}
        getRowKey={(row) => row.documentId}
        filters={filters}
        sorts={sorts}
        columns={columns}
        rowActions={rowActions}
        labels={labels}
        regionAttrs={{ 'data-slot': 'sitting-history-scroll' }}
      />
    </section>
  );
}
