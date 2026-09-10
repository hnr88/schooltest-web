'use client';

import { useMemo } from 'react';
import { Eye } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  DIRECTORY_ALL,
  DIRECTORY_PAGE_SIZE_MAX,
  DirectoryTable,
  applyClientDirectoryMode,
  useDirectoryState,
  type DirectoryColumnDef,
  type DirectoryFilterDef,
  type DirectoryLabels,
  type DirectoryQueryStatus,
  type DirectorySortDef,
} from '@/modules/directory';
import { useRouter } from '@/i18n/navigation';
import {
  RosterAcaraCell,
  RosterConfidenceCell,
  RosterGrowthCell,
  RosterScoreCell,
  RosterWeakestCell,
} from '@/modules/teacher/components/RosterStudentCells';
import {
  STUDENTS_RESULTS_DEFAULT_SORT,
  studentsResultsClientConfig,
} from '@/modules/teacher/lib/students-results-directory';
import { studentResultsHref } from '@/modules/teacher/lib/results-shell';
import { phasesOf } from '@/modules/results/lib/roster-order';
import type { StudentsResultsTableProps } from '@/modules/teacher/types/students-table.types';

// The roster renders through the shared directory kit (ops/34), `client` mode.
// The read never fails here (ClassResultsScreen owns the error branch), so the
// query status is a synthetic no-op and the kit only ever shows rows or its
// empty arms. The drill-down keeps working two kit-legal ways: the student
// cell is the row's first-cell anchor (§L-rownav, locale-aware Link), and an
// explicit `Open` quick action with `write: false` sits in the actions menu.
const NO_OP_QUERY: DirectoryQueryStatus = {
  isPending: false,
  isError: false,
  isFetching: false,
  refetch: () => {},
};

function StudentsResultsTable({ classDocumentId, rows }: StudentsResultsTableProps) {
  const t = useTranslations('Teacher.results.students');
  const router = useRouter();

  const filters = useMemo<readonly DirectoryFilterDef[]>(() => {
    const phases = phasesOf(rows);
    return [
      {
        key: 'phase',
        label: t('filterLabel'),
        options: [
          { value: DIRECTORY_ALL, label: t('filterAll') },
          ...phases.map((phase) => ({ value: phase, label: phase })),
        ],
      },
    ];
  }, [rows, t]);

  const sorts = useMemo<readonly DirectorySortDef[]>(
    () => [
      { value: 'roster', label: t('sortDefault') },
      { value: 'name:asc', label: t('sortNameAsc') },
      { value: 'name:desc', label: t('sortNameDesc') },
      { value: 'score:low', label: t('sortScoreLow') },
      { value: 'score:high', label: t('sortScoreHigh') },
    ],
    [t],
  );

  const state = useDirectoryState({
    filters,
    sorts,
    defaultSort: STUDENTS_RESULTS_DEFAULT_SORT,
    mode: 'client',
    pageSize: DIRECTORY_PAGE_SIZE_MAX,
  });

  const client = applyClientDirectoryMode(rows, state.params, studentsResultsClientConfig);

  const labels = useMemo<Partial<DirectoryLabels>>(
    () => ({
      searchPlaceholder: t('searchPlaceholder'),
      searchLabel: t('searchLabel'),
      sortLabel: t('sortLabel'),
      clearFilters: t('clearFilters'),
      showingCount: ({ showing, total }) => t('showingCount', { showing, total }),
      pageCount: ({ page, pageCount: pages }) => t('pageCount', { page, pageCount: pages }),
      paginationLabel: t('paginationLabel'),
      previous: t('previous'),
      next: t('next'),
      rowMenuLabel: t('rowMenuLabel'),
      emptyNoneTitle: t('emptyTitle'),
      emptyNoneDescription: t('emptyDescription'),
      emptyNoMatchesTitle: t('noMatchesTitle'),
      emptyNoMatchesDescription: t('noMatchesDescription'),
      loadingLabel: t('loadingLabel'),
    }),
    [t],
  );

  return (
    <DirectoryTable
      state={state}
      query={NO_OP_QUERY}
      rows={client.rows}
      meta={client.meta}
      filters={filters}
      sorts={sorts}
      pagination="none"
      columns={[
        {
          key: 'student',
          header: t('student'),
          cell: (row) => (
            <span className="inline-flex min-h-11 min-w-11 items-center">{row.student.name}</span>
          ),
        },
        { key: 'score', header: t('score'), sortable: true, sortValues: { asc: 'score:low', desc: 'score:high' }, cell: (row) => <RosterScoreCell row={row} /> },
        { key: 'growth', header: t('growth'), cell: (row) => <RosterGrowthCell row={row} /> },
        { key: 'weakest', header: t('weakest'), cell: (row) => <RosterWeakestCell row={row} /> },
        { key: 'acara', header: t('acara'), cell: (row) => <RosterAcaraCell row={row} /> },
        { key: 'confidence', header: t('confidence'), cell: (row) => <RosterConfidenceCell row={row} /> },
      ]}
      rowActions={(row) => [
        {
          label: t('actionOpen'),
          icon: Eye,
          quick: true,
          write: false,
          onSelect: (target) =>
            router.push(studentResultsHref(classDocumentId, target.student.document_id)),
        },
      ]}
      getRowKey={(row) => row.student.document_id}
      rowHref={(row) => studentResultsHref(classDocumentId, row.student.document_id)}
      rowAttrs={(row) => ({
        'data-slot': 'student-results-row',
        'data-student-id': row.student.document_id,
        'data-scored': row.result !== null,
      })}
      labels={labels}
    />
  );
}

export { StudentsResultsTable };
