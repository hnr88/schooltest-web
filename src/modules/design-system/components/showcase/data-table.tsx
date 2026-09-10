'use client';

/**
 * Row 46 — the Table exhibit rendered through the shared directory kit
 * (`@/modules/directory`, `client` mode over `SHOWCASE_TABLE_ROWS`) instead
 * of a bespoke `<Table>` + six literal `<PaginationItem>`s: the screen whose
 * job is to demonstrate the canonical component now uses it too.
 *
 * This file must be a Client Component: `useDirectoryState` reads
 * `useSearchParams` and `DirectoryTable` calls `useTranslations`, neither of
 * which is legal inside an `async` Server Component. `DataSection` wraps this
 * mount in a `<Suspense>` boundary because `useSearchParams` bails out of
 * prerender otherwise.
 */
import { useMemo } from 'react';

import { useTranslations } from 'next-intl';

import {
  applyClientDirectoryMode,
  DirectoryTable,
  useDirectoryState,
  type DirectoryClientConfig,
  type DirectoryColumnDef,
  type DirectoryLabels,
  type DirectoryQueryStatus,
  type DirectoryRowAction,
  type DirectorySortDef,
} from '@/modules/directory';

import { StatusBadge } from '@/modules/design-system/components/status-badge';
import {
  SHOWCASE_TABLE_COMPARATORS,
  SHOWCASE_TABLE_ROWS,
  type ShowcaseTableRow,
} from '@/modules/design-system/constants/showcase-table.constants';

// Gallery-only sample data never sits behind a real query — an always-idle
// status keeps the kit's ten-arm state machine on its happy path.
const IDLE_QUERY: DirectoryQueryStatus = {
  isPending: false,
  isError: false,
  isFetching: false,
  refetch: () => {},
};

const showcaseClientConfig: DirectoryClientConfig<ShowcaseTableRow> = {
  comparators: SHOWCASE_TABLE_COMPARATORS,
};

function DataTable() {
  const t = useTranslations('DesignSystem');

  // Row 46 — `tableDate`/`tableAvg` are reused BY KEY for both the column
  // headers and these sort options (an arrow glyph, not a translated word,
  // tells the two directions apart) rather than minting four more catalog
  // keys for what the column headers already say.
  const sorts = useMemo<readonly DirectorySortDef[]>(
    () => [
      { value: 'date:asc', label: `${t('tableDate')} ↑` },
      { value: 'date:desc', label: `${t('tableDate')} ↓` },
      { value: 'avg:asc', label: `${t('tableAvg')} ↑` },
      { value: 'avg:desc', label: `${t('tableAvg')} ↓` },
    ],
    [t],
  );

  const state = useDirectoryState({
    filters: [],
    sorts,
    defaultSort: '',
    mode: 'client',
    // D-57 / row 46 — declared for the record: `DirectoryTable` does not yet
    // thread `pagination.variant` through to `DirectoryPagination`'s own
    // `variant` prop (the two lines proof/03.md promised were never written),
    // so this still renders the kit's default `steps` pager rather than the
    // numbered ellipsis one the design draws. See the row's proof.
    pagination: { variant: 'numbered' },
  });

  const page = useMemo(
    () => applyClientDirectoryMode(SHOWCASE_TABLE_ROWS, state.params, showcaseClientConfig),
    [state.params],
  );

  const labels = useMemo<Partial<DirectoryLabels>>(
    () => ({
      searchPlaceholder: t('tableSearchPlaceholder'),
      sortLabel: t('tableSortLabel'),
      rowMenuLabel: t('tableRowMenu'),
      previous: t('paginationPrevious'),
      next: t('paginationNext'),
      paginationLabel: t('paginationNavAria'),
      showingCount: ({ showing, total }) => t('tableShowing', { showing, total }),
      pageCount: ({ page: current, pageCount, total }) =>
        t('tablePageCount', { page: current, pageCount, total }),
    }),
    [t],
  );

  const columns = useMemo<readonly DirectoryColumnDef<ShowcaseTableRow>[]>(
    () => [
      {
        key: 'test',
        header: t('tableTest'),
        cell: (row) => <span className="font-medium">{t(row.nameKey)}</span>,
      },
      {
        key: 'date',
        header: t('tableDate'),
        sortable: true,
        sortValues: { asc: 'date:asc', desc: 'date:desc' },
        cell: (row) => row.date,
      },
      {
        key: 'questions',
        header: t('tableQuestions'),
        cell: (row) => row.questions,
      },
      {
        key: 'avg',
        header: t('tableAvg'),
        sortable: true,
        sortValues: { asc: 'avg:asc', desc: 'avg:desc' },
        cell: (row) => row.avg,
      },
      {
        key: 'status',
        header: t('tableStatus'),
        cell: (row) => <StatusBadge status={row.status} label={t(row.labelKey)} />,
      },
    ],
    [t],
  );

  // The design's kebab (`:406`) as one rowActions entry — menu-only (no
  // `quick`/`icon`), a local no-op: OP-2 governs product surfaces and these
  // rows are gallery-only sample data (showcase-table.constants.ts:1-2).
  const rowActions = useMemo(
    () =>
      (): readonly DirectoryRowAction<ShowcaseTableRow>[] => [
        { label: t('tableRowOpen'), onSelect: () => {}, write: false },
      ],
    [t],
  );

  return (
    <DirectoryTable
      state={state}
      query={IDLE_QUERY}
      rows={page.rows}
      meta={page.meta}
      getRowKey={(row) => row.nameKey}
      filters={[]}
      sorts={sorts}
      columns={columns}
      rowActions={rowActions}
      selectable={false}
      header={{
        title: t('tableCaption'),
        secondary: { label: t('tableExport'), write: false, onSelect: () => {} },
      }}
      labels={labels}
    />
  );
}

export { DataTable };
