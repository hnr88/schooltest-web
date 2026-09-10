import type { DirectoryClientConfig } from '@/modules/directory';

import type { RosterRow } from '@/modules/results/types/roster.types';

/**
 * ops/34 — the `client`-mode behaviour the Students-results table hands the
 * directory kit (D-KIT-MODE). The panel's `sortRosterRows` order stays the
 * LOADED order (the default `roster` sort carries no comparator), the named
 * sorts are the task's two axes — student name and score — and the ACARA
 * phase filter matches the same field `filterByPhase` reads, so the kit's
 * filter is the old select's exact semantics.
 */

export const STUDENTS_RESULTS_DEFAULT_SORT = 'roster';

export const STUDENTS_RESULTS_SORT_VALUES = [
  'roster',
  'name:asc',
  'name:desc',
  'score:low',
  'score:high',
] as const;

/** Unscored students sort LAST (never as a zero) in BOTH score directions. */
function compareScore(a: RosterRow, b: RosterRow, direction: 1 | -1): number {
  const aScore = a.result?.overall.domain_score ?? null;
  const bScore = b.result?.overall.domain_score ?? null;
  if (aScore === null && bScore === null) return 0;
  if (aScore === null) return 1;
  if (bScore === null) return -1;
  return (aScore - bScore) * direction;
}

/** Same field `roster-order.ts`'s filterByPhase matches; a null phase matches no named value. */
function byPhase(row: RosterRow, value: string): boolean {
  return row.result?.acara_phase === value;
}

export const studentsResultsClientConfig: DirectoryClientConfig<RosterRow> = {
  searchText: (row) => [row.student.name],
  filterPredicates: { phase: byPhase },
  comparators: {
    'name:asc': (a, b) => a.student.name.localeCompare(b.student.name),
    'name:desc': (a, b) => b.student.name.localeCompare(a.student.name),
    'score:low': (a, b) => compareScore(a, b, 1),
    'score:high': (a, b) => compareScore(a, b, -1),
  },
};
