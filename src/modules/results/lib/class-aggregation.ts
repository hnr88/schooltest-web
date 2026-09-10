import { displaySkills } from '@/modules/results/lib/display-skills';
import type { DisplaySkill, ResultView } from '@schooltest/scoring-contracts';

import type { RosterRow } from '@/modules/results/types/roster.types';

/**
 * Screen A/B (dashboard §2-§3) — the PURE aggregation layer behind the class
 * roster and analytics, over the v2 roster read `/my/students/results?class=`
 * (task 23 contract: one row per ROSTER STUDENT, `result: null` where no
 * official Result exists). Every function carries an honesty guardrail rather
 * than a formula: an unscored student is never a zero, a not-assessed skill is
 * never a weak one, a `band_movement` row contributes no growth number, and a
 * null ACARA phase gets its OWN bucket (D17). Growth is read from each row's
 * `overall` block ONLY — the roster endpoint omits `history`, and an omitted
 * history must never be mistaken for a source of deltas.
 */

/** The scored views of a roster — the one unwrap every scored-only aggregate below is fed from. */
export function resultViewsOf(rows: readonly RosterRow[]): ResultView[] {
  return rows.flatMap((row) => (row.result === null ? [] : [row.result]));
}

/** Weakest skill (§2): minimum `domain_score` among ASSESSED tiles, ties by canonical order; not-assessed is unmeasured, not weak; Critical (no posterior, no band) is excluded. */
export function weakestSkill(view: ResultView): { skill: DisplaySkill; score: number } | null {
  const candidates = displaySkills(view)
    .map((tile, index) => ({ skill: tile.skill, score: tile.domain_score, index }))
    .filter((candidate): candidate is { skill: DisplaySkill; score: number; index: number } =>
      candidate.score !== null && displaySkills(view)[candidate.index].source !== 'gate',
    );
  const weakest = candidates.reduce<{ skill: DisplaySkill; score: number; index: number } | null>(
    (best, candidate) =>
      best === null || candidate.score < best.score || (candidate.score === best.score && candidate.index < best.index)
        ? candidate
        : best,
    null,
  );
  return weakest === null ? null : { skill: weakest.skill, score: weakest.score };
}

/** Class average over SCORED rows only — excluding unscored students (correctly) changes the denominator; `null` when no row is scored. */
export function classAverage(rows: readonly ResultView[]): number | null {
  const scored = rows.map((row) => row.overall.domain_score).filter((score): score is number => score !== null);
  if (scored.length === 0) return null;
  return scored.reduce((sum, score) => sum + score, 0) / scored.length;
}

/**
 * Mean of the rows' RELIABLE changes only — a `band_movement` row (delta null)
 * contributes nothing, and no delta is computed from two scores. FEWER THAN 3
 * qualifying rows is insufficient by rule: an average over one or two reliable
 * movers would be read as a trend.
 */
export type ReliableGrowthAverage =
  | { state: 'insufficient_data'; qualifying: number }
  | { state: 'average'; value: number; qualifying: number };

export function reliableGrowthAverage(rows: readonly ResultView[]): ReliableGrowthAverage {
  const deltas = rows
    .map((row) => row.overall)
    .filter((overall) => overall.delta_reliable === true && overall.delta !== null)
    .map((overall) => overall.delta as number);
  if (deltas.length < 3) return { state: 'insufficient_data', qualifying: deltas.length };
  return { state: 'average', value: deltas.reduce((sum, delta) => sum + delta, 0) / deltas.length, qualifying: deltas.length };
}

/**
 * Counts per `acara_phase` over the WHOLE roster — a result-less student lands
 * in the null bucket beside students whose result carries no measured phase
 * (task 33 decision, recorded in the commit: D17 keeps unmeasured students
 * neither dropped nor folded into a named phase, and excluding result-less
 * students would shrink the chart below the roster — scoredCount's exact
 * defect). Null means exactly "no ACARA phase measured".
 * Deterministic: count desc, then label asc, null last among equals.
 */
export function phaseSpread(rows: readonly RosterRow[]): Array<{ phase: string | null; count: number }> {
  const counts = new Map<string, { phase: string | null; count: number }>();
  for (const row of rows) {
    const phase = row.result === null ? null : row.result.acara_phase;
    const key = phase ?? '\u0000null';
    const seen = counts.get(key);
    counts.set(key, { phase, count: (seen?.count ?? 0) + 1 });
  }
  return [...counts.values()].sort((a, b) => {
    if (a.count !== b.count) return b.count - a.count;
    if (a.phase === null) return 1;
    if (b.phase === null) return -1;
    return a.phase.localeCompare(b.phase);
  });
}

/**
 * Scored over the ROSTER total — the roster read delivers result-less students
 * as rows (R5's extension). Taking a bare `ResultView[]` here was the defect
 * that rendered "18 of 18 scored" for a class of 30: `total` counted only the
 * students who happen to have a result. "Scored" still means an actual
 * `overall.domain_score` — a present result with an unscored overall is not a score.
 */
export function scoredCount(rows: readonly RosterRow[]): { scored: number; total: number } {
  return {
    scored: rows.filter((row) => row.result !== null && row.result.overall.domain_score !== null).length,
    total: rows.length,
  };
}
