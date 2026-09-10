'use client';

import { XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

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
import { StatusPill } from '@/modules/design-system';

import { TEST_SLOTS } from '@/modules/classes/constants/subskills.constants';
import {
  EMPTY_VALUE,
  scoreLabel,
  studentDisplayName,
  testFor,
} from '@/modules/classes/lib/class-detail.helpers';

import type { ClassStudentsTableProps } from '@/modules/classes/types/components.types';
import type {
  ClassDetailStudent,
  StudentTestResult,
  TestStatus,
} from '@/modules/classes/types/class-detail.types';

// ops/30 — the C-CLS-05 roster rendered THROUGH the shared directory kit in
// `client` mode (D-KIT-MODE: the class-detail read serves the whole roster
// unpaginated). The kit owns search over the student's name, the test-status
// filter, the name sort, the URL round-trip, the no-matches arm and the pager;
// this file owns the pictured seven columns — Student | Test A | Score |
// ACARA | Test B | Score | ACARA, the fixed order the spec pins (and the e2e
// asserts by cell position).
//
// The default sort is the SERVED order (no `sort` comparator for the default),
// so the list reads exactly what C-CLS-05 returned until the teacher picks a
// sort; the pager is wired but a roster fits one page at the contract's size.
//
// The kit's loading/error arms exist behind `query`; this task's write set
// does not include ClassDetailScreen, whose pre-existing skeleton/Alert
// branches still guard the header chrome, so the table defaults to the idle
// status the screen's happy branch implies. A later screen re-parent passes
// the real query object — no component change.

/** The table's own props: the screen's contract plus the kit's query slot. */
export interface ClassStudentsTableKitProps extends ClassStudentsTableProps {
  /** The consumer's query status; the kit's loading/error/stale arms read it. */
  query?: DirectoryQueryStatus;
  onRemoveStudent?: (student: ClassDetailStudent) => void;
  removingDocumentIds?: ReadonlySet<string>;
}

const IDLE_QUERY: DirectoryQueryStatus = {
  isPending: false,
  isError: false,
  isFetching: false,
  refetch: () => {},
};

/** The row's test status across BOTH slots: the honest aggregate the filter filters on. */
export function rosterStatusOf(student: ClassDetailStudent): TestStatus {
  const statuses = TEST_SLOTS.map(
    (slot) => testFor(student.tests, slot)?.status ?? 'not_started',
  );
  if (statuses.every((status) => status === 'not_started')) return 'not_started';
  if (statuses.every((status) => status === 'completed')) return 'completed';
  // Any in-progress sitting, or a mixed started/pending pair — still working.
  return 'in_progress';
}

const byStudentName = (a: ClassDetailStudent, b: ClassDetailStudent): number =>
  studentDisplayName(a).localeCompare(studentDisplayName(b)) ||
  a.documentId.localeCompare(b.documentId);

// Client-mode contract: search over the student's name, the derived test
// status filter, and the name comparators. Pure — the kit stays domain-free.
const rosterClientConfig: DirectoryClientConfig<ClassDetailStudent> = {
  searchText: (row) => [studentDisplayName(row)],
  filterPredicates: {
    status: (row, value) => rosterStatusOf(row) === value,
  },
  comparators: {
    'name:asc': byStudentName,
    'name:desc': (a, b) => byStudentName(b, a),
  },
};

function StatusCell({ test, labels }: { test: StudentTestResult | null; labels: Labels }) {
  if (test === null || test.status === 'not_started') {
    return <span className="text-sm text-muted-foreground">{labels.notStarted}</span>;
  }
  if (test.status === 'in_progress') {
    return <StatusPill tone="warning">{labels.inProgress}</StatusPill>;
  }
  return <StatusPill tone="success">{labels.done}</StatusPill>;
}

interface Labels {
  notStarted: string;
  inProgress: string;
  done: string;
}

export function ClassStudentsTable({
  classDocumentId,
  students,
  query = IDLE_QUERY,
  onRemoveStudent,
  removingDocumentIds,
}: ClassStudentsTableKitProps) {
  const t = useTranslations('Classes.detail.roster');
  const detail = useTranslations('Classes.detail');
  const table = useTranslations('Classes.detail.table');

  const filters = useMemo<readonly DirectoryFilterDef[]>(
    () => [
      {
        key: 'status',
        label: t('filterStatusLabel'),
        options: [
          { value: DIRECTORY_ALL, label: t('filterStatusAll') },
          { value: 'not_started', label: table('statusNotStarted') },
          { value: 'in_progress', label: table('statusInProgress') },
          { value: 'completed', label: table('statusDone') },
        ],
      },
    ],
    [t, table],
  );

  const sorts = useMemo<readonly DirectorySortDef[]>(
    () => [
      { value: 'name:asc', label: t('sortNameAsc') },
      { value: 'name:desc', label: t('sortNameDesc') },
    ],
    [t],
  );

  const state = useDirectoryState({
    filters,
    sorts,
    // The served order IS the default — a roster reads the C-CLS-05 order
    // until the teacher explicitly picks a sort.
    defaultSort: '',
    mode: 'client',
    pageSize: 100,
  });
  const page = useMemo(
    () => applyClientDirectoryMode(students, state.params, rosterClientConfig),
    [students, state.params],
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
      showingCount: ({ showing, total }) => t('showingCount', { showing, total }),
      pageCount: ({ page, pageCount, total }) => t('pageCount', { page, pageCount, total }),
      emptyNoMatchesTitle: t('filteredEmptyTitle'),
      emptyNoMatchesDescription: t('filteredEmptyDescription'),
      errorTitle: detail('errorTitle'),
      errorStaleBanner: t('errorStaleBanner'),
      errorDescription: detail('errorDescription'),
      retry: detail('retry'),
      loadingLabel: t('loading'),
    }),
    [t, detail],
  );

  const columns = useMemo<readonly DirectoryColumnDef<ClassDetailStudent>[]>(() => {
    const statusLabels: Labels = {
      notStarted: table('statusNotStarted'),
      inProgress: table('statusInProgress'),
      done: table('statusDone'),
    };
    return [
      {
        key: 'student',
        header: table('columnStudent'),
        cell: (row) => (
          <span className="font-semibold text-foreground">{studentDisplayName(row)}</span>
        ),
      },
      ...TEST_SLOTS.flatMap((slot) => [
        {
          key: `${slot}-status`,
          header: slot === 'A' ? table('columnTestA') : table('columnTestB'),
          className: 'text-center',
          cell: (row: ClassDetailStudent) => (
            <StatusCell test={testFor(row.tests, slot)} labels={statusLabels} />
          ),
        },
        {
          key: `${slot}-score`,
          header: table('columnScore'),
          className: 'text-center font-semibold',
          cell: (row: ClassDetailStudent) => scoreLabel(testFor(row.tests, slot)),
        },
        {
          key: `${slot}-acara`,
          header: table('columnAcara'),
          className: 'text-center text-sm',
          cell: (row: ClassDetailStudent) => testFor(row.tests, slot)?.acara_phase ?? EMPTY_VALUE,
        },
      ]),
    ];
  }, [table]);

  const rowActions = useMemo<
    ((row: ClassDetailStudent) => readonly DirectoryRowAction<ClassDetailStudent>[]) | undefined
  >(() => {
    if (!onRemoveStudent) return undefined;
    return (row) => {
      if (removingDocumentIds?.has(row.documentId)) return [];
      return [
        {
          label: t('removeStudentAria', { name: studentDisplayName(row) }),
          onSelect: (target) => onRemoveStudent(target),
          destructive: true,
          quick: true,
          icon: XIcon,
          write: true,
        },
      ];
    };
  }, [onRemoveStudent, removingDocumentIds, t]);

  return (
    <div data-slot="class-students-table">
      <DirectoryTable
        state={state}
        query={query}
        rows={page.rows}
        meta={page.meta}
        getRowKey={(row) => row.documentId}
        rowHref={(row) =>
          `/dashboard/school/classes/${classDocumentId}/students/${row.documentId}`
        }
        filters={filters}
        sorts={sorts}
        columns={columns}
        labels={labels}
        rowActions={rowActions}
      />
    </div>
  );
}
