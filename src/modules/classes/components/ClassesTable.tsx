'use client';

import { Pencil, Trash2 } from 'lucide-react';
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
        cell: (row) => <span className="font-medium text-foreground">{row.name}</span>,
      },
      {
        key: 'teacher',
        header: table('columnTeacher'),
        cell: (row) => {
          const teacher = teacherNames(row.teachers);
          return teacher === '' ? (
            <span className="text-muted-foreground">{table('teacherNone')}</span>
          ) : (
            teacher
          );
        },
      },
      {
        key: 'students',
        header: table('columnStudents'),
        className: 'text-center tabular-nums',
        cell: (row) => row.student_count,
      },
      {
        key: 'testsCompleted',
        header: table('columnTestsCompleted'),
        className: 'text-center',
        cell: (row) => {
          const testsCompleted = formatTestsCompleted(
            completions,
            row.documentId,
            row.student_count,
          );
          return testsCompleted === null ? (
            <span className="text-muted-foreground">{table('unknown')}</span>
          ) : (
            <span className="flex flex-col items-center gap-1 sm:flex-row sm:justify-center sm:gap-4">
              <span className="inline-flex items-baseline gap-1.5 whitespace-nowrap">
                <span className="text-muted-foreground">{participation('testA')}</span>
                <span className="tabular-nums">{testsCompleted.testA}</span>
              </span>
              <span className="inline-flex items-baseline gap-1.5 whitespace-nowrap">
                <span className="text-muted-foreground">{participation('testB')}</span>
                <span className="tabular-nums">{testsCompleted.testB}</span>
              </span>
            </span>
          );
        },
      },
    ],
    [completions, participation, table],
  );

  const rowActions = (row: SchoolClass): readonly DirectoryRowAction<SchoolClass>[] => [
    {
      label: actions('edit'),
      icon: Pencil,
      quick: true,
      write: true,
      onSelect: () => onEdit(row),
    },
    {
      label: actions('delete'),
      icon: Trash2,
      quick: true,
      destructive: true,
      write: true,
      onSelect: () => setDeleteTarget(row),
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
