import { DISPLAY_SKILL_ORDER, displaySkills } from '@/modules/results/lib/display-skills';
import type { DisplaySkill, ResultView } from '@schooltest/scoring-contracts';

/**
 * Screen B (dashboard §3) — the pure analytics layer over the SCORED views of
 * the roster (`resultViewsOf(rows)` from class-aggregation.ts). The task-34
 * half of the pure layer, split to a sibling file for the 200-line rule; the
 * functions are the ones landed at 0b98317, moved byte-for-byte. All five
 * aggregate EVIDENCE, not people — they rank rows and return rows; naming the
 * student is the caller's job, which the wrapper's `student` block serves.
 */

// `resultViewsOf(rows)` — the scored views of the roster. All five aggregate
// EVIDENCE, not people — they rank rows and return rows; naming the student is
// the caller's job, which the wrapper's `student` block now serves.

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

/** Top reliable gains: a RELIABLE POSITIVE `overall.delta`, desc, capped at 5; band_movement cannot rank, and no delta is ever computed client-side. ops/34: a reliable NEGATIVE delta is a decline — it belongs in needsSupport, never in the gains list (the ranked lists render one mover per qualifying row, so an absent direction check put declining students on the gains board). Rows return IN ORDER — the caller names students from the wrapper's `student` block. */
export function topGains(rows: readonly ResultView[]): ResultView[] {
  return rows
    .filter(
      (row) =>
        row.overall.delta_reliable === true &&
        row.overall.delta !== null &&
        row.overall.delta > 0,
    )
    .sort((a, b) => (b.overall.delta as number) - (a.overall.delta as number))
    .slice(0, 5);
}

/** Needs support: lowest `overall.domain_score`, with a RELIABLE NEGATIVE delta ranking FIRST — going backwards outranks consistently low, and that ordering silently inverts under a naive sort. An unreliable negative is not a decline and ranks by score. Rows return IN ORDER, capped at 5. */
export function needsSupport(rows: readonly ResultView[]): ResultView[] {
  const isReliableDecline = (row: ResultView): boolean =>
    row.overall.delta_reliable === true && row.overall.delta !== null && row.overall.delta < 0;
  // ops/34 — a reliable GAINER is the gains list's row, not a support candidate:
  // the same student must not be celebrated and flagged at once.
  const isReliableGainer = (row: ResultView): boolean =>
    row.overall.delta_reliable === true && row.overall.delta !== null && row.overall.delta > 0;
  return rows
    .filter((row) => row.overall.domain_score !== null && !isReliableGainer(row))
    .sort((a, b) => {
      const aDecline = isReliableDecline(a) ? 0 : 1;
      const bDecline = isReliableDecline(b) ? 0 : 1;
      if (aDecline !== bDecline) return aDecline - bDecline;
      if (aDecline === 0) return (a.overall.delta as number) - (b.overall.delta as number);
      return (a.overall.domain_score as number) - (b.overall.domain_score as number);
    })
    .slice(0, 5);
}

/**
 * The DISPLAY order for the insights tab (dashboard §3): weakest average first.
 * The canonical order is the AGGREGATE order (the pure map above); this is the
 * teacher-facing ranking on top of it. Stable sort, so equal averages keep the
 * canonical tile order — the tie-break is never insertion luck.
 */
export function weakestFirstAverages(rows: readonly ResultView[]): SubskillAverage[] {
  return subskillAverages(rows).sort((a, b) => a.average - b.average);
}

/**
 * The SIGN and magnitude of a server-sent difference, as the delta pill prints
 * it: direction is the sign (compared to zero — no cut, no band), magnitude is
 * `Math.abs`. The difference itself is never computed here; every caller passes
 * a delta the API already sent.
 */
export function progressDelta(value: number): { direction: 'up' | 'flat' | 'down'; magnitude: number } {
  return { direction: value > 0 ? 'up' : value < 0 ? 'down' : 'flat', magnitude: Math.abs(value) };
}
