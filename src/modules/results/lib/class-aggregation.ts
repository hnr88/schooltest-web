import { DISPLAY_SKILL_ORDER, displaySkills } from '@/modules/results/lib/display-skills';
import type { DisplaySkill, ResultView } from '@schooltest/scoring-contracts';

/**
 * Screen A (dashboard §2) — the PURE aggregation layer behind the class
 * roster. Every function reads the v2 ResultView rows `/my/students/results`
 * answers, and every one carries an honesty guardrail rather than a formula:
 * an unscored student is never a zero, a not-assessed skill is never a weak
 * one, a `band_movement` row contributes no growth number, and a null
 * ACARA phase gets its OWN bucket (D17) instead of folding to the bottom of
 * the scale.
 *
 * Growth is read from each row's `overall` block ONLY — the roster endpoint
 * omits `history` for payload size, and an omitted history must never be
 * mistaken for a student with no sittings (or for a source of deltas).
 */

/** Weakest skill per student row (dashboard §2): the minimum `domain_score` among ASSESSED skills only, ties broken by canonical display order. A not-assessed skill is not a weak skill — it is an unmeasured one — and Critical (no posterior, no band) is excluded by the Screen C ruling. */
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

/** Class average over SCORED rows only — a student with no result is not a zero, and excluding them (correctly) changes the denominator. `null` when no row is scored. */
export function classAverage(rows: readonly ResultView[]): number | null {
  const scored = rows.map((row) => row.overall.domain_score).filter((score): score is number => score !== null);
  if (scored.length === 0) return null;
  return scored.reduce((sum, score) => sum + score, 0) / scored.length;
}

/**
 * Mean of the rows' RELIABLE changes only: `delta_reliable === true` AND a
 * numeric `delta` — a `band_movement` row has `delta: null` by design and
 * contributes nothing, and the client never computes a delta from two scores
 * (the server owns that judgement). FEWER THAN 3 qualifying rows is
 * insufficient by rule: a class average over one or two reliable movers would
 * be read as a trend.
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
 * Counts per `acara_phase`, with null in its OWN bucket (D17): a student whose
 * Decoding was never assessed gets no phase, and folding that null into
 * "beginning" would place unmeasured students at the bottom of a class chart.
 * Deterministic order: count descending, then label ascending, null label
 * first among equals.
 */
export function phaseSpread(rows: readonly ResultView[]): Array<{ phase: string | null; count: number }> {
  const counts = new Map<string, { phase: string | null; count: number }>();
  for (const row of rows) {
    const key = row.acara_phase ?? '\u0000null';
    const seen = counts.get(key);
    counts.set(key, { phase: row.acara_phase, count: (seen?.count ?? 0) + 1 });
  }
  return [...counts.values()].sort((a, b) => {
    if (a.count !== b.count) return b.count - a.count;
    if (a.phase === null) return 1;
    if (b.phase === null) return -1;
    return a.phase.localeCompare(b.phase);
  });
}

/** Scored over total, where "scored" means an actual `overall.domain_score` — not a present row. */
export function scoredCount(rows: readonly ResultView[]): { scored: number; total: number } {
  return {
    scored: rows.filter((row) => row.overall.domain_score !== null).length,
    total: rows.length,
  };
}

/** Canonical display order — re-exported for the roster row's tie-breaks so no caller re-derives it. */
export const ROSTER_SKILL_ORDER: readonly DisplaySkill[] = DISPLAY_SKILL_ORDER;
