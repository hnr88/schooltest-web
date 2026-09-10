'use client';

import { LayoutGrid, List } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { DirectoryTable, applyClientDirectoryMode, useDirectoryState } from '@/modules/directory';
import { CycleBanner } from '@/modules/teach';
import {
  ResultsClassRow,
  ResultsClassSoonCell,
  ResultsClassStatus,
} from '@/modules/teacher/components/ResultsClassRow';
import { TeacherClassCompletionRow } from '@/modules/teacher/components/TeacherClassCompletionRow';
import { TeacherLiveSessionBanner } from '@/modules/teacher/components/TeacherLiveSessionBanner';
import { findTestLabel } from '@/modules/teacher/lib/join-code';
import { classResultsHref, deriveResultsStatus } from '@/modules/teacher/lib/results-shell';
import { useTeacherDashboardQuery } from '@/modules/teacher/queries/use-teacher-dashboard.query';
import { useTeacherTestsQuery } from '@/modules/teacher/queries/use-teacher-tests.query';
import type { DashboardClass } from '@/modules/teacher/types/teacher.types';

// /dashboard/results — the classes list (Teacher Portal v2.dc.html:57–216): the
// list of classes the teacher owns, each linking to that class's detail. The
// classes come from ONE live read of C-TD-1 (`GET /api/teacher/dashboard`).
//
// teacher/06 — the list is the SHARED kit in client mode (U-03), never a second
// table: the toolbar, the year/status filters, the three sorts, the ten-state
// body machine and both empty arms are `@/modules/directory`'s. Tiles ⇄ table
// swaps `layout` only — same rows, same toolbar, same states — and the choice
// is a URL param, so it survives a reload. The live strip draws one navy card
// per entry of the additive `live_sessions[]` (`:73–91`), and the term/context
// banner sits in the header (`:66`) on C-TEACH-02. Copy: `title`/`description`
// stay (D-33) and the design's admin footnote (`:63`) ships beside them.
function ResultsScreen() {
  const tList = useTranslations('Teacher.results.list');
  const tResults = useTranslations('Teacher.results');
  const tDash = useTranslations('Teacher.dashboard');
  const dashboard = useTeacherDashboardQuery();
  const tests = useTeacherTestsQuery();
  // Stable identities for the memoized controls below — the query's `?? []`
  // fallback would otherwise hand them a fresh array every render.
  const classes = useMemo(() => dashboard.data?.classes ?? [], [dashboard.data]);
  const liveSessions = useMemo(() => dashboard.data?.live_sessions ?? [], [dashboard.data]);
  const status = deriveResultsStatus({
    isLoading: dashboard.isPending,
    isError: dashboard.isError,
    isSuccess: dashboard.isSuccess,
    itemCount: classes.length,
  });

  // The kit owns the toolbar; the surface only names its controls. Year-level
  // options come from the server's own values, sentinel first.
  const yearBands = useMemo(
    () => [...new Set(classes.map((c) => c.year_band).filter((b) => b !== null))].sort(),
    [classes],
  );
  const filters = useMemo(
    () => [
      {
        key: 'year_band',
        label: tList('filterYear'),
        options: [
          { value: 'all', label: tList('filterAllYears') },
          ...yearBands.map((band) => ({ value: band, label: band })),
        ],
      },
      {
        key: 'status',
        label: tList('filterStatus'),
        options: [
          { value: 'all', label: tList('filterAnyStatus') },
          { value: 'sitting_now', label: tList('statusSittingNow') },
          { value: 'scheduled', label: tList('statusScheduled') },
          { value: 'no_tests_yet', label: tList('statusNoTestsYet') },
          { value: 'complete', label: tList('statusComplete') },
        ],
      },
    ],
    [tList, yearBands],
  );
  const sorts = useMemo(
    () => [
      { value: 'name', label: tList('sortName') },
      { value: 'students', label: tList('sortStudents') },
      { value: 'progress', label: tList('sortProgress') },
    ],
    [tList],
  );
  const labels = useMemo(
    () => ({
      searchPlaceholder: tList('searchPlaceholder'),
      searchLabel: tList('searchLabel'),
      sortLabel: tList('sortLabel'),
      layoutLabel: tList('layoutLabel'),
      clearFilters: tList('clearFilters'),
      loadingLabel: tList('loading'),
      errorTitle: tList('errorTitle'),
      errorDescription: tList('errorDescription'),
      retry: tList('retry'),
      emptyNoneTitle: tList('emptyTitle'),
      emptyNoneDescription: tList('emptyDescription'),
      emptyNoMatchesTitle: tList('emptyNoMatchesTitle'),
      emptyNoMatchesDescription: tList('emptyNoMatchesDescription'),
      showingCount: ({ showing }: { showing: number; total: number }) =>
        tList('countLabel', { count: showing }),
    }),
    [tList],
  );

  const state = useDirectoryState({
    filters,
    sorts,
    defaultSort: 'name',
    mode: 'client',
    layouts: ['tiles', 'table'],
    defaultLayout: 'tiles',
  });

  // Client mode (U-03): the whole array is already loaded; the kit's reducer
  // applies exactly what the server would have — search, filters, sort.
  const view = useMemo(
    () =>
      applyClientDirectoryMode(classes, state.params, {
        searchText: (row) => [row.name, row.year_band ?? ''],
        filterPredicates: {
          year_band: (row, value) => row.year_band === value,
          status: (row, value) => row.status === value,
        },
        comparators: {
          name: (a, b) => a.name.localeCompare(b.name),
          students: (a, b) => b.student_count - a.student_count,
          // The design's "Least progress" (`:3064` — least work done first),
          // restated over the completions the wire carries.
          progress: (a, b) =>
            a.test_a.completed + a.test_b.completed - (b.test_a.completed + b.test_b.completed),
        },
      }),
    [classes, state.params],
  );

  const layoutOptions = [
    { value: 'tiles' as const, label: tList('tiles'), icon: LayoutGrid },
    { value: 'table' as const, label: tList('list'), icon: List },
  ];

  const tableColumns = [
    {
      key: 'class',
      header: tList('classColumn'),
      cell: (row: DashboardClass) => <ResultsClassRow classCard={row} variant="cell" />,
    },
    {
      key: 'reading',
      header: tList('reading'),
      cell: (row: DashboardClass) => (
        <span className="flex min-w-0 flex-col gap-2">
          <TeacherClassCompletionRow label={tDash('testA')} completion={row.test_a} />
          <TeacherClassCompletionRow label={tDash('testB')} completion={row.test_b} />
        </span>
      ),
    },
    {
      key: 'listening',
      header: tList('listening'),
      cell: () => <ResultsClassSoonCell label={tList('listening')} />,
    },
    {
      key: 'writing',
      header: tList('writing'),
      cell: () => <ResultsClassSoonCell label={tList('writing')} />,
    },
    {
      key: 'speaking',
      header: tList('speaking'),
      cell: () => <ResultsClassSoonCell label={tList('speaking')} />,
    },
    {
      key: 'status',
      header: tList('statusColumn'),
      cell: (row: DashboardClass) => <ResultsClassStatus classCard={row} />,
    },
  ];

  // A `<div>`, not a second `<main>`: the READ-ONLY `SidebarInset` primitive
  // already renders this route's `<main>` (task 047, measured). `data-surface`/
  // `data-status` stay where every spec reads them.
  return (
    <div
      data-surface="teacher-results"
      data-status={status}
      className="flex flex-1 animate-in flex-col gap-6 px-4 py-6 duration-300 ease-out-expo slide-in-from-bottom-2 motion-reduce:animate-none sm:px-6 lg:px-8 lg:py-7"
    >
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-portal-title font-bold text-foreground">{tResults('title')}</h1>
          <p className="text-lede text-body">{tResults('description')}</p>
          <p className="text-body-sm text-body">{tList('adminNote')}</p>
        </div>
        {status === 'ready' && classes.length > 0 ? (
          <CycleBanner documentId={classes[0].class_document_id} />
        ) : null}
      </div>

      {liveSessions.length > 0 && status === 'ready' ? (
        <section data-slot="live-strip" className="flex flex-col gap-2.5">
          <p
            data-slot="live-strip-label"
            className="flex items-center gap-2 text-[11.5px] font-medium tracking-wider text-body uppercase"
          >
            {tList('liveStripLabel', { count: liveSessions.length })}
            <span
              aria-hidden="true"
              className="size-1.5 animate-pulse rounded-full bg-destructive motion-reduce:animate-none"
            />
          </p>
          <div className="flex flex-wrap gap-2.5">
            {liveSessions.map((session) => (
              <TeacherLiveSessionBanner
                key={session.sitting_document_id}
                session={session}
                testLabel={findTestLabel(tests.data?.tests ?? [], session.test_variant)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* The kit owns ALL the state arms — loading, the 403/404 walls, the
          retrying error, both empties (existing `list.*` copy), and the rows.
          The retry is the same real `dashboard.refetch()`. */}
      <section
        data-slot="teacher-classes-list"
        className="flex flex-col rounded-card bg-card p-4 shadow-sm sm:p-6"
      >
        {state.layout === 'table' ? (
          <DirectoryTable
            state={state}
            query={dashboard}
            rows={view.rows}
            meta={view.meta}
            filters={filters}
            sorts={sorts}
            labels={labels}
            getRowKey={(row: DashboardClass) => row.class_document_id}
            rowHref={(row: DashboardClass) => classResultsHref(row.class_document_id)}
            layout="table"
            columns={tableColumns}
            layoutOptions={layoutOptions}
            pagination="none"
          />
        ) : (
          <DirectoryTable
            state={state}
            query={dashboard}
            rows={view.rows}
            meta={view.meta}
            filters={filters}
            sorts={sorts}
            labels={labels}
            getRowKey={(row: DashboardClass) => row.class_document_id}
            layout="tiles"
            renderRow={(row) => <ResultsClassRow classCard={row} variant="tile" />}
            layoutOptions={layoutOptions}
            pagination="none"
          />
        )}
      </section>
    </div>
  );
}

export { ResultsScreen };
