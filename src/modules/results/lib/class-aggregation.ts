import { DISPLAY_SKILL_ORDER, displaySkills } from '@/modules/results/lib/display-skills';
import type { DisplaySkill, ResultView } from '@schooltest/scoring-contracts';

/**
 * Screen A/B (dashboard §2-§3) — the PURE aggregation layer behind the class
 * roster and analytics, over the v2 ResultView rows `/my/students/results`
 * answers. Every function carries an honesty guardrail rather than a formula:
 * an unscored student is never a zero, a not-assessed skill is never a weak
 * one, a `band_movement` row contributes no growth number, and a null ACARA
 * phase gets its OWN bucket (D17). Growth is read from each row's `overall`
 * block ONLY — the roster endpoint omits `history`, and an omitted history
 * must never be mistaken for a source of deltas.
 */

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

/** Counts per `acara_phase` with null in its OWN bucket (D17) — folding it into a named phase would put unmeasured students at the bottom of the chart. Deterministic: count desc, then label asc, null last among equals. */
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

// Task 34 (scoped) — Screen B's pure layer: same input (roster rows), same
// discipline. All five aggregate EVIDENCE, not people — they rank rows and
// return rows; naming the student is the caller's job once the wrapper lands.

export interface SubskillAverage {
  skill: DisplaySkill;
  average: number;
  assessed: number;
  /** Rows not in the average — "n of N assessed" needs it; a hidden exclusion is the same defect as counting unscored students as zero. */
  excluded: number;
}

/** Per-skill mean of `domain_score` over students with THAT skill assessed, in canonical order over the seven display tiles. D13 PER-FUNCTION: Critical IS included here (each skill averages within itself, no cross-scale mixing) but counted NOWHERE else (see secureCounts). */
export function subskillAverages(rows: readonly ResultView[]): SubskillAverage[] {
  const tallies = new Map<DisplaySkill, { sum: number; assessed: number }>();
  for (const row of rows) {
    for (const tile of displaySkills(row)) {
      if (tile.domain_score === null) continue;
      const seen = tallies.get(tile.skill) ?? { sum: 0, assessed: 0 };
      tallies.set(tile.skill, { sum: seen.sum + tile.domain_score, assessed: seen.assessed + 1 });
    }
  }
  return DISPLAY_SKILL_ORDER.flatMap((skill) => {
    const tally = tallies.get(skill);
    if (tally === undefined) return [];
    return [{
      skill,
      average: tally.sum / tally.assessed,
      assessed: tally.assessed,
      excluded: rows.length - tally.assessed,
    }];
  });
}

export interface SecureCount {
  skill: DisplaySkill;
  /** Counted exactly as the API sent it — never recomputed from a score: bands are posterior cuts and the client has no posterior. */
  secure: number;
  assessed: number;
}

/** The "secure" tally per BANDED skill (§3's retired-vocabulary "Mastered"). Critical is ABSENT by construction — the gate has no band, so there is no `secure` to count. */
export function secureCounts(rows: readonly ResultView[]): SecureCount[] {
  const counts = new Map<DisplaySkill, { secure: number; assessed: number }>();
  for (const row of rows) {
    for (const tile of displaySkills(row)) {
      if (tile.source === 'gate' || tile.status === null) continue; // no band on the gate; a gap is not a band either
      const seen = counts.get(tile.skill) ?? { secure: 0, assessed: 0 };
      counts.set(tile.skill, {
        secure: seen.secure + (tile.status === 'secure' ? 1 : 0),
        assessed: seen.assessed + 1,
      });
    }
  }
  return DISPLAY_SKILL_ORDER.flatMap((skill) => {
    const count = counts.get(skill);
    return count === undefined ? [] : [{ skill, ...count }];
  });
}

export interface StrandMean {
  average: number | null;
  assessed: number;
}

/** §3/D2 strand means. A `single_strand` student is EXCLUDED from the strand they did not sit — no B1 evidence means no B1 contribution, by any value including a fallback. The counts say so. */
export function vocabStrandMeans(rows: readonly ResultView[]): { a2: StrandMean; b1: StrandMean } {
  const mean = (scores: Array<number | null>): StrandMean => {
    const sat = scores.filter((score): score is number => score !== null);
    return sat.length === 0
      ? { average: null, assessed: 0 }
      : { average: sat.reduce((sum, score) => sum + score, 0) / sat.length, assessed: sat.length };
  };
  const a2: Array<number | null> = [];
  const b1: Array<number | null> = [];
  for (const row of rows) {
    // A row that sat only one strand is absent from the other, whatever rode along.
    a2.push(row.vocab.single_strand === 'b1' ? null : row.vocab.a2.domain_score);
    b1.push(row.vocab.single_strand === 'a2' ? null : row.vocab.b1.domain_score);
  }
  return { a2: mean(a2), b1: mean(b1) };
}

/** Top reliable gains: `overall.delta` desc where `delta_reliable` and numeric, capped at 5; band_movement cannot rank, and no delta is ever computed client-side. Rows return IN ORDER — naming students is the caller's job once the wrapper lands. */
export function topGains(rows: readonly ResultView[]): ResultView[] {
  return rows
    .filter((row) => row.overall.delta_reliable === true && row.overall.delta !== null)
    .sort((a, b) => (b.overall.delta as number) - (a.overall.delta as number))
    .slice(0, 5);
}

/** Needs support: lowest `overall.domain_score`, with a RELIABLE NEGATIVE delta ranking FIRST — going backwards outranks consistently low, and that ordering silently inverts under a naive sort. An unreliable negative is not a decline and ranks by score. Rows return IN ORDER, capped at 5. */
export function needsSupport(rows: readonly ResultView[]): ResultView[] {
  const isReliableDecline = (row: ResultView): boolean =>
    row.overall.delta_reliable === true && row.overall.delta !== null && row.overall.delta < 0;
  return rows
    .filter((row) => row.overall.domain_score !== null)
    .sort((a, b) => {
      const aDecline = isReliableDecline(a) ? 0 : 1;
      const bDecline = isReliableDecline(b) ? 0 : 1;
      if (aDecline !== bDecline) return aDecline - bDecline;
      if (aDecline === 0) return (a.overall.delta as number) - (b.overall.delta as number);
      return (a.overall.domain_score as number) - (b.overall.domain_score as number);
    })
    .slice(0, 5);
}
