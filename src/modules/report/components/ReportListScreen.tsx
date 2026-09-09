'use client';

import { useCallback, useMemo } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

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
import { getDisplayLabelState } from '@/modules/report/lib/display-label';
import { getResultStatusTone } from '@/modules/report/lib/report-status';
import { useMyStudentResultsQuery } from '@/modules/report/queries/use-my-student-results.query';
import { resultStatusSchema } from '@/modules/report/schemas/result-view.schema';
import type { MyStudentsResultsRow } from '@/modules/report/schemas/result-view.schema';

/** The translation KEY of the row's phase heading — the phase, or its absence. */
function phaseLabelKeyOf(row: MyStudentsResultsRow): string {
  return getDisplayLabelState(row) === 'pending'
    ? 'displayLabelPending'
    : 'displayLabelNotApplicable';
}

/** Unpublished rows sort as epoch 0, so they sink under every dated row. */
function publishedMs(row: MyStudentsResultsRow): number {
  return row.published_at ? Date.parse(row.published_at) : 0;
}

// E11-01 — the entry point into the teacher report: the C-11 list of this
// teacher's own students' OFFICIAL results, exactly as the API scopes it.
// OP-3 (ops/36): the generic directory kit owns search, filter, sort,
// pagination and the states — the endpoint answers the whole array (hard cap
// 100, no pagination) so the kit runs in `client` mode and the hook is
// untouched. Rows carry no student name by design (PII stays off the
// ResultView), so search runs over the published row text — phase, skill,
// status — and the status filter stands in for the unsatisfiable
// "filter by student".
export function ReportListScreen() {
  const t = useTranslations('Report');
  const format = useFormatter();
  const router = useRouter();
  const resultsQuery = useMyStudentResultsQuery();

  const filters = useMemo<DirectoryFilterDef[]>(
    () => [
      {
        key: 'status',
        label: t('statusLabel'),
        options: [
          { value: DIRECTORY_ALL, label: t('listFilterAll') },
          ...resultStatusSchema.options.map((status) => ({
            value: status,
            label: t(`resultStatus.${status}`),
          })),
        ],
      },
    ],
    [t],
  );

  const sorts = useMemo<DirectorySortDef[]>(
    () => [
      { value: 'date:desc', label: t('listSortNewest') },
      { value: 'date:asc', label: t('listSortOldest') },
    ],
    [t],
  );

  const state = useDirectoryState({ filters, sorts, defaultSort: 'date:desc', mode: 'client' });

  const labels = useMemo<Partial<DirectoryLabels>>(
    () => ({
      searchPlaceholder: t('listSearchPlaceholder'),
      searchLabel: t('listSearchLabel'),
      sortLabel: t('listSortLabel'),
      clearFilters: t('listClearFilters'),
      paginationLabel: t('listPaginationLabel'),
      previous: t('listPrevious'),
      next: t('listNext'),
      rowMenuLabel: t('listRowMenuLabel'),
      showingCount: ({ showing, total }) => t('listShowingCount', { showing, total }),
      pageCount: ({ page, pageCount, total }) => t('listPageCount', { page, pageCount, total }),
      emptyNoneTitle: t('listEmptyTitle'),
      emptyNoneDescription: t('listEmptyDescription'),
      emptyNoMatchesTitle: t('listFilteredEmptyTitle'),
      emptyNoMatchesDescription: t('listFilteredEmptyDescription'),
      errorTitle: t('listErrorTitle'),
      errorStaleBanner: t('listStaleBanner'),
      errorDescription: t('listErrorDescription'),
      retry: t('listRetry'),
      loadingLabel: t('listLoading'),
    }),
    [t],
  );

  const columns = useMemo<readonly DirectoryColumnDef<MyStudentsResultsRow>[]>(
    () => [
      {
        key: 'phase',
        header: t('acaraPhaseLabel'),
        cell: (row) => (
          <span
            data-slot="report-list-row"
            className="block truncate font-medium text-foreground"
          >
            {row.acara_phase !== null
              ? row.acara_phase
              : t(phaseLabelKeyOf(row))}
          </span>
        ),
      },
      {
        key: 'skill',
        header: t('skillLabel'),
        cell: (row) => (row.skill ? t(`skills.${row.skill}`) : t('skillCombined')),
      },
      {
        key: 'published',
        header: t('publishedLabel'),
        cell: (row) =>
          row.published_at
            ? format.dateTime(new Date(row.published_at), { dateStyle: 'medium' })
            : t('notPublished'),
      },
      {
        key: 'status',
        header: t('statusLabel'),
        cell: (row) => (
          <StatusPill tone={getResultStatusTone(row.status)}>
            {t(`resultStatus.${row.status}`)}
          </StatusPill>
        ),
      },
    ],
    [t, format],
  );

  const rowActions = useCallback(
    (row: MyStudentsResultsRow): readonly DirectoryRowAction<MyStudentsResultsRow>[] => [
      {
        label: t('listOpenReport'),
        icon: ArrowUpRight,
        quick: true,
        onSelect: () => router.push(`/dashboard/reports/${row.document_id}`),
      },
    ],
    [t, router],
  );

  const { rows, meta } = applyClientDirectoryMode<MyStudentsResultsRow>(
    resultsQuery.data ?? [],
    state.params,
    {
      searchText: (row) => [
        row.acara_phase !== null ? row.acara_phase : t(phaseLabelKeyOf(row)),
        row.skill ? t(`skills.${row.skill}`) : t('skillCombined'),
        t(`resultStatus.${row.status}`),
      ],
      filterPredicates: {
        status: (row, value) => row.status === value,
      },
      comparators: {
        'date:asc': (a, b) => publishedMs(a) - publishedMs(b),
        'date:desc': (a, b) => publishedMs(b) - publishedMs(a),
      },
    } satisfies DirectoryClientConfig<MyStudentsResultsRow>,
  );

  return (
    <main
      data-surface="teacher-report-list"
      className="flex flex-1 animate-in flex-col gap-6 px-4 py-6 duration-300 ease-out-expo slide-in-from-bottom-2 motion-reduce:animate-none sm:px-6 lg:px-8 lg:py-7"
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-portal-title font-bold text-foreground">{t('listTitle')}</h1>
        <p className="text-lede text-muted-foreground">{t('listDescription')}</p>
      </div>
      <section
        data-slot="report-list-panel"
        className="flex flex-col rounded-card bg-card px-4 py-5 shadow-sm sm:px-6"
      >
        <DirectoryTable
          state={state}
          query={resultsQuery}
          rows={rows}
          meta={meta}
          filters={filters}
          sorts={sorts}
          columns={columns}
          rowActions={rowActions}
          rowHref={(row) => `/dashboard/reports/${row.document_id}`}
          getRowKey={(row) => row.document_id}
          labels={labels}
        />
      </section>
    </main>
  );
}
