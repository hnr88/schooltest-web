'use client';

import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import {
  applyClientDirectoryMode,
  DirectoryTable,
  DIRECTORY_ALL,
  useDirectoryState,
  type DirectoryClientConfig,
  type DirectoryColumnDef,
  type DirectoryFilterDef,
  type DirectoryLabels,
  type DirectoryQueryStatus,
  type DirectoryRowAction,
  type DirectorySortDef,
} from '@/modules/directory';

import { ClassDeleteDialog } from '@/modules/classes/components/ClassDeleteDialog';
import { YEAR_BANDS } from '@/modules/classes/constants/year-bands.constants';
import { useClassRowActions } from '@/modules/classes/hooks/use-class-row-actions';
import {
  classBadge,
  formatTestsCompleted,
  teacherNames,
} from '@/modules/classes/lib/classes-table.helpers';

import type { ClassesTableProps } from '@/modules/classes/types/components.types';
import type { SchoolClass } from '@/modules/classes/types/classes.types';

// ops/30 — the C-CLS-01 roster rendered THROUGH the shared directory kit in
// `client` mode (D-KIT-MODE: the endpoint serves no list params, so search,
// the year-band filter, the sorts and the pager reduce the loaded array). The
// kit owns the toolbar, the URL round-trip, the pager and the empty arms; the
// two row actions come from the existing edit dialog and the C-CLS-04 delete
// confirm, each declared `write: true` (D-20). The fifth header is the kit's
// own sr-only actions column — renaming a class, changing its teacher and
// deleting it stay reachable, now as two inline quick actions plus the `⋯`
// overflow.
//
// The kit's loading/error arms exist behind `query`; this task's write set
// does not include ClassesScreen, whose pre-existing skeleton/Alert branches
// still guard the header chrome, so the table defaults to the idle status the
// screen's happy branch implies. A later screen re-parent passes the real
// query object — no component change.

/** The table's own props: the screen's contract plus the kit's query slot. */
export interface ClassesTableKitProps extends ClassesTableProps {
  /** The consumer's query status; the kit's loading/error/stale arms read it. */
  query?: DirectoryQueryStatus;
}

const IDLE_QUERY: DirectoryQueryStatus = {
  isPending: false,
  isError: false,
  isFetching: false,
  refetch: () => {},
};

const byName = (a: SchoolClass, b: SchoolClass): number =>
  a.name.localeCompare(b.name) || a.documentId.localeCompare(b.documentId);

// Client-mode contract: search over the class name, the year-band filter
// (`none` matches the classes the redesign modal creates without a band), and
// the name/size comparators. Pure — the kit stays domain-free.
const classesClientConfig: DirectoryClientConfig<SchoolClass> = {
  searchText: (row) => [row.name],
  filterPredicates: {
    year_band: (row, value) =>
      value === 'none' ? row.year_band === null : row.year_band === value,
  },
  comparators: {
    'name:asc': byName,
    'name:desc': (a, b) => byName(b, a),
    'students:desc': (a, b) => b.student_count - a.student_count || byName(a, b),
    'students:asc': (a, b) => a.student_count - b.student_count || byName(a, b),
  },
};

export function ClassesTable({ rows, completions, onEdit, query = IDLE_QUERY }: ClassesTableKitProps) {
  const t = useTranslations('Classes.list');
  const tc = useTranslations('Classes');
  const table = useTranslations('Classes.table');
  const actions = useTranslations('Classes.actions');
  const yearBands = useTranslations('Classes.yearBands');
  // Reused rather than duplicated: the participation monitor already ships
  // "Test A" / "Test B" in every locale, and these are the same two test slots.
  const participation = useTranslations('SchoolAdmin.participation.columns');

  const [deleteTarget, setDeleteTarget] = useState<SchoolClass | null>(null);
  const { deleteOpen, setDeleteOpen, deletePending, handleDelete } = useClassRowActions(deleteTarget);

  const filters = useMemo<readonly DirectoryFilterDef[]>(() => {
    return [
      {
        key: 'year_band',
        label: table('columnYearBand'),
        options: [
          { value: DIRECTORY_ALL, label: t('filterYearBandAll') },
          ...YEAR_BANDS.map((band) => ({ value: band, label: yearBands(band) })),
          { value: 'none', label: table('yearBandNone') },
        ],
      },
    ];
  }, [t, table, yearBands]);

  const sorts = useMemo<readonly DirectorySortDef[]>(
    () => [
      { value: 'name:asc', label: t('sortNameAsc') },
      { value: 'name:desc', label: t('sortNameDesc') },
      { value: 'students:desc', label: t('sortStudentsDesc') },
      { value: 'students:asc', label: t('sortStudentsAsc') },
    ],
    [t],
  );

  const state = useDirectoryState({
    filters,
    sorts,
    defaultSort: 'name:asc',
    mode: 'client',
  });
  const page = useMemo(
    () => applyClientDirectoryMode(rows, state.params, classesClientConfig),
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
      errorTitle: tc('errorTitle'),
      errorStaleBanner: t('errorStaleBanner'),
      errorDescription: tc('errorDescription'),
      retry: tc('retry'),
      loadingLabel: t('loading'),
    }),
    [t, tc],
  );

  const columns = useMemo<readonly DirectoryColumnDef<SchoolClass>[]>(
    () => [
      {
        key: 'name',
        header: table('columnClass'),
        cell: (row) => (
          <span className="flex items-center gap-3.5">
            <span
              aria-hidden="true"
              className="grid size-[38px] flex-none place-items-center rounded-tile bg-[#EEF1F6] text-[12.5px] font-bold text-[#0E2350]"
            >
              {classBadge(row.name)}
            </span>
            <span className="text-[14.5px] font-semibold text-foreground">{row.name}</span>
          </span>
        ),
      },
      {
        key: 'teacher',
        header: table('columnTeacher'),
        // sa-lists-audit — the School Admin design's row columns are PLAIN
        // text (`School Admin Portal.dc.html:263-265`: 13.5px ink, no metric
        // sublabel); the metric arm's "teacher" sublabel was the mismatch.
        grid: 'text',
        cell: (row) => {
          const teacher = teacherNames(row.teachers);
          return teacher === '' ? (
            <span className="text-[#9AA6B8]">{table('teacherNone')}</span>
          ) : (
            teacher
          );
        },
      },
      {
        key: 'students',
        header: table('columnStudents'),
        grid: 'text',
        className: 'tabular-nums',
        cell: (row) => row.student_count,
      },
      {
        key: 'testsCompleted',
        header: table('columnTestsCompleted'),
        grid: 'text',
        cell: (row) => {
          const testsCompleted = formatTestsCompleted(
            completions,
            row.documentId,
            row.student_count,
          );
          // The design's completion column is ONE muted 13px line
          // (`:266`: "{{ c.pct }} done"); the two real per-test counts read
          // the same way as a single line, without the metric sublabel block
          // whose overflow-hidden clipping previously ate the figures.
          return testsCompleted === null ? (
            <span className="text-[#9AA6B8]">{table('unknown')}</span>
          ) : (
            <span className="whitespace-nowrap text-[13px] text-[#7C8698]">
              {participation('testA')} {testsCompleted.testA} · {participation('testB')}{' '}
              {testsCompleted.testB}
            </span>
          );
        },
      },
    ],
    [completions, participation, table],
  );

  // sa-lists-audit — the School Admin design's rows carry ONLY the ⋯ menu
  // (`:268-283`); the inline quick icon pair was the Ops row's shape, so edit
  // and delete now live in the overflow menu alone (the CRUD spec already
  // drives both through `menuitem`).
  const rowActions = (row: SchoolClass): readonly DirectoryRowAction<SchoolClass>[] => [
    {
      label: actions('edit'),
      write: true,
      onSelect: () => onEdit(row),
    },
    {
      label: actions('delete'),
      destructive: true,
      write: true,
      // BUG (sa-acceptance pass): the confirm is fully controlled by
      // `deleteOpen` (OpsConfirmDialog -> OpsDialog `open`), so only setting the
      // target left the dialog on open={false} forever — "Delete class" did
      // nothing visible and C-CLS-04 was unreachable from this roster.
      onSelect: () => {
        setDeleteTarget(row);
        setDeleteOpen(true);
      },
    },
  ];

  return (
    <div data-slot="school-classes-table">
      <DirectoryTable
        state={state}
        query={query}
        rows={page.rows}
        meta={page.meta}
        getRowKey={(row) => row.documentId}
        rowHref={(row) => `/dashboard/school/classes/${row.documentId}`}
        filters={filters}
        sorts={sorts}
        columns={columns}
        rowActions={rowActions}
        labels={labels}
      />
      {deleteTarget ? (
        <ClassDeleteDialog
          schoolClass={deleteTarget}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          pending={deletePending}
          onConfirm={() => void handleDelete()}
        />
      ) : null}
    </div>
  );
}
