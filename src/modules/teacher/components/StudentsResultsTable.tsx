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
  type DirectoryClientConfig,
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
import { studentsResultsClientConfig } from '@/modules/teacher/lib/students-results-directory';
import { studentResultsHref } from '@/modules/teacher/lib/results-shell';
import { phasesOf } from '@/modules/results/lib/roster-order';
import { ACARA_PHASES } from '@/modules/classes/schemas/class-detail.schema';
import type { StudentsResultsTableProps } from '@/modules/teacher/types/students-table.types';
import type { RosterRow } from '@/modules/results/types/roster.types';

// The roster renders through the shared directory kit (ops/34), `client` mode.
// The read never fails here (ClassResultsScreen owns the error branch), so the
// query status is a synthetic no-op and the kit only ever shows rows or its
// empty arms. The drill-down keeps working two kit-legal ways: the student
// cell is the row's first-cell anchor (§L-rownav, locale-aware Link), and an
// explicit `Open` quick action with `write: false` sits in the actions menu.
//
// Task 14 — the four sorts are the design's own (`Teacher Portal v2.dc.html:678`,
// `sSorters` `:3103–3109`): Name A–Z, Highest score, Lowest score, ACARA phase.
// The first three are the app's existing strings for exactly those orderings
// (D-33 — the design never substitutes existing copy); the ACARA phase sort is
// the one genuinely new string. `score:asc` IS today's fixed attention order
// (`sortRosterRows`: lowest score first, result-less students LAST — never as a
// zero, ties by name) and stays the defaultSort, so nothing a teacher relies on
// changes. Every value lives in the `sorts` array — `setSort` and the URL parse
// both validate against it and silently fall back to the default otherwise, so
// an undeclared pair is a dead header. The design's own band `<select>` at
// `:673` is `display:none`; the app's live ACARA-phase filter stays (Law 2,
// D-33) as the kit's phase filter below. The header row pins with task 04's
// sticky recipe (U-17/D-71): one focusable scroll region takes both axes, so
// axe's `scrollable-region-focusable` never fires here.
const NO_OP_QUERY: DirectoryQueryStatus = {
  isPending: false,
  isError: false,
  isFetching: false,
  refetch: () => {},
};

/** Task 14 — the default stays today's order: lowest score first, result-less last. */
const STUDENTS_RESULTS_SORT_DEFAULT = 'score:asc';

const scoreOf = (row: RosterRow): number | null =>
  row.result === null ? null : row.result.overall.domain_score;

const byName = (a: RosterRow, b: RosterRow): number => a.student.name.localeCompare(b.student.name);

/**
 * The attention order, verbatim: lowest score first, an unscored student LAST
 * (never as a zero), ties by name for a deterministic table.
 */
function byScoreAsc(a: RosterRow, b: RosterRow): number {
  const aScore = scoreOf(a);
  const bScore = scoreOf(b);
  if (aScore === null && bScore === null) return byName(a, b);
  if (aScore === null) return 1;
  if (bScore === null) return -1;
  return aScore !== bScore ? aScore - bScore : byName(a, b);
}

/** Highest score first; an unscored student stays LAST in this direction too — never a zero. */
function byScoreDesc(a: RosterRow, b: RosterRow): number {
  const aScore = scoreOf(a);
  const bScore = scoreOf(b);
  if (aScore === null && bScore === null) return byName(a, b);
  if (aScore === null) return 1;
  if (bScore === null) return -1;
  return aScore !== bScore ? bScore - aScore : byName(a, b);
}

/**
 * The served phase on the contract's own axis — the order `ACARA_PHASES` mirrors
 * (Beginning → Emerging → Developing → Consolidating). X-03: the phase is a
 * served string and the client never re-derives it from scores; the match is
 * case-insensitive because the wire's casing has drifted both ways (the roster
 * serves `beginning`, the class-detail enum is `Beginning`) and the DISPLAYED
 * string stays the served one either way. A row with no measured phase — no
 * result, or a result whose phase is null or outside the axis — is unmeasured
 * and sorts LAST, the same honesty every other sort here gives result-less rows.
 */
function phaseRank(row: RosterRow): number | null {
  const phase = row.result?.acara_phase ?? null;
  if (phase === null) return null;
  const index = ACARA_PHASES.findIndex(
    (candidate) => candidate.toLowerCase() === phase.toLowerCase(),
  );
  return index === -1 ? null : index;
}

function byPhaseAsc(a: RosterRow, b: RosterRow): number {
  const aRank = phaseRank(a);
  const bRank = phaseRank(b);
  if (aRank === null && bRank === null) return byName(a, b);
  if (aRank === null) return 1;
  if (bRank === null) return -1;
  return aRank !== bRank ? aRank - bRank : byName(a, b);
}

/**
 * ops/34's config, extended with the task-14 sort values. The lib's own
 * `score:low`/`score:high`/`name:desc` entries ride along but are UNREACHABLE:
 * `setSort` and the URL parse both validate the sort against the `sorts` array,
 * so no control or link can ever select them again (the lib and its unit pins
 * are that file's own and stay untouched).
 */
const studentsSortConfig: DirectoryClientConfig<RosterRow> = {
  ...studentsResultsClientConfig,
  comparators: {
    ...studentsResultsClientConfig.comparators,
    'score:asc': byScoreAsc,
    'score:desc': byScoreDesc,
    'acara_phase:asc': byPhaseAsc,
  },
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
      { value: 'name:asc', label: t('sortNameAsc') },
      { value: 'score:desc', label: t('sortScoreHigh') },
      { value: 'score:asc', label: t('sortScoreLow') },
      { value: 'acara_phase:asc', label: t('sortAcaraPhase') },
    ],
    [t],
  );

  const state = useDirectoryState({
    filters,
    sorts,
    defaultSort: STUDENTS_RESULTS_SORT_DEFAULT,
    mode: 'client',
    pageSize: DIRECTORY_PAGE_SIZE_MAX,
  });

  const client = applyClientDirectoryMode(rows, state.params, studentsSortConfig);

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
        { key: 'score', header: t('score'), sortable: true, sortValues: { asc: 'score:asc', desc: 'score:desc' }, cell: (row) => <RosterScoreCell row={row} /> },
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
      sticky={true}
    />
  );
}

export { StudentsResultsTable };
