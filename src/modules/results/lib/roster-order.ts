import type { RosterRow } from '@/modules/results/types/roster.types';

/**
 * Roster PRESENTATION order and filtering (dashboard §2) — split from
 * `class-aggregation.ts` (the 200-line rule), which owns the aggregate numbers;
 * this file owns only the order the table shows and the phase filter's inputs.
 */

/**
 * Roster order: LOWEST score first — the roster's job is surfacing the students
 * who need attention, and the analytics tabs rank the top separately. Unscored
 * students sort LAST (never as a zero), ties break by the student's name for a
 * deterministic table.
 */
export function sortRosterRows(rows: readonly RosterRow[]): RosterRow[] {
  const scoreOf = (row: RosterRow): number | null => (row.result === null ? null : row.result.overall.domain_score);
  return [...rows].sort((a, b) => {
    const aScore = scoreOf(a);
    const bScore = scoreOf(b);
    if (aScore === null && bScore === null) return a.student.name.localeCompare(b.student.name);
    if (aScore === null) return 1;
    if (bScore === null) return -1;
    if (aScore !== bScore) return aScore - bScore;
    return a.student.name.localeCompare(b.student.name);
  });
}

/** The distinct NAMED phases present in the roster (the phase filter's options); null buckets are not a phase to filter to. */
export function phasesOf(rows: readonly RosterRow[]): string[] {
  const names = new Set<string>();
  for (const row of rows) {
    if (row.result?.acara_phase != null) names.add(row.result.acara_phase);
  }
  return [...names].sort((a, b) => a.localeCompare(b));
}

/** The roster filtered to one ACARA phase; `null` (all phases) returns every row in order. */
export function filterByPhase(rows: readonly RosterRow[], phase: string | null): RosterRow[] {
  if (phase === null) return [...rows];
  return rows.filter((row) => row.result?.acara_phase === phase);
}
