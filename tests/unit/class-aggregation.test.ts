import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, test } from 'vitest';

import { resultViewSchema, type ResultView } from '@schooltest/scoring-contracts';

import {
  classAverage,
  phaseSpread,
  reliableGrowthAverage,
  scoredCount,
  weakestSkill,
} from '@/modules/results/lib/class-aggregation';

/**
 * Task 33 (scoped) — the pure roster aggregation layer, over the REAL contract
 * fixture mutated into multiple students. Each test names its honesty
 * guardrail: not-assessed is never a weak skill, Critical is never comparable,
 * an unscored student is never a zero, band_movement contributes no growth,
 * fewer than three reliable movers is "not enough data", and a null ACARA
 * phase gets its own bucket (D17) instead of folding to the bottom.
 */

const fixture = resultViewSchema.parse(
  JSON.parse(
    readFileSync(resolve(process.cwd(), '../mvp/contracts/scoring/fixtures/result-view.json'), 'utf8'),
  ),
) as ResultView;

/** Re-scores one fixture attribute entry, preserving the scored branch's own fields. */
function rescored(
  entry: NonNullable<ResultView['attributes'][keyof ResultView['attributes']]>,
  domainScore: number,
  status: 'secure' | 'developing' | 'emerging' | 'not_yet',
) {
  if (entry.status === 'not_assessed') throw new Error('fixture drifted');
  return { ...entry, domain_score: domainScore, status };
}

function withScores(overrides: Array<Partial<ResultView>>): ResultView[] {
  return overrides.map((override) => resultViewSchema.parse({ ...fixture, ...override }));
}

describe('weakestSkill — minimum among assessed banded skills only', () => {
  test('picks the lowest assessed score and never a not-assessed or gated skill', () => {
    // The SEVEN TILES are the comparison set (dashboard §2): Decoding 92,
    // Vocabulary (blend) 76, Grammar 72, Detail 74, Inference 80 — Gist is the
    // not-assessed gap and Critical is the gated tile, both excluded.
    expect(weakestSkill(fixture)).toEqual({ skill: 'Grammar', score: 72 });
  });

  test('ties break to canonical display order (Grammar before Detail at equal scores)', () => {
    // Grammar and Detail tie at 54 — Grammar precedes Detail in canonical tile
    // order (Decoding, Vocabulary, Grammar, Gist, Detail, Inference), so the
    // tie-break is deterministic, never insertion- or score-order dependent.
    const tied = {
      ...fixture,
      attributes: {
        ...fixture.attributes,
        Grammar: rescored(fixture.attributes.Grammar!, 54, 'emerging'),
        Detail: rescored(fixture.attributes.Detail!, 54, 'emerging'),
      },
    };
    const weakest = weakestSkill(resultViewSchema.parse(tied));
    expect(weakest).toEqual({ skill: 'Grammar', score: 54 });
    // The ordering is deterministic across repeated calls.
    expect(weakestSkill(resultViewSchema.parse(tied))).toEqual(weakest);
  });

  test('a student with nothing assessed yields null — no weak skill is invented', () => {
    const attributes = Object.fromEntries(
      Object.keys(fixture.attributes).map((key) => [key, { status: 'not_assessed', items_seen: 0 }]),
    );
    const nothing = {
      ...fixture,
      attributes,
      vocab: { ...fixture.vocab, blended: null, status: 'not_assessed' as const, a2: { domain_score: null }, b1: { domain_score: null } },
    };
    expect(weakestSkill(nothing as ResultView)).toBeNull();
  });
});

describe('classAverage — scored rows only', () => {
  test('means the scored rows and excludes unscored students from the denominator', () => {
    const rows = withScores([
      { overall: { ...fixture.overall, domain_score: 80 } },
      { overall: { ...fixture.overall, domain_score: 60 } },
      { overall: { ...fixture.overall, domain_score: null } }, // unscored: excluded, never a zero
    ]);
    expect(classAverage(rows)).toBe(70);
  });

  test('no scored rows at all yields null, not 0', () => {
    const rows = withScores([{ overall: { ...fixture.overall, domain_score: null } }]);
    expect(classAverage(rows)).toBeNull();
    expect(classAverage([])).toBeNull();
  });
});

describe('reliableGrowthAverage — reliable numeric deltas only, <3 is insufficient', () => {
  test('means only rows with delta_reliable true AND a numeric delta', () => {
    const rows = withScores([
      { overall: { ...fixture.overall, delta: 10, delta_reliable: true } },
      { overall: { ...fixture.overall, delta: 4, delta_reliable: true } },
      { overall: { ...fixture.overall, delta: null, delta_reliable: null } }, // band_movement: contributes nothing
      { overall: { ...fixture.overall, delta: 40, delta_reliable: false } }, // unreliable: contributes nothing
      { overall: { ...fixture.overall, delta: null, delta_reliable: true } }, // reliable but no number: nothing
    ]);
    const result = reliableGrowthAverage(rows);
    expect(result).toEqual({ state: 'insufficient_data', qualifying: 2 });
  });

  test('three qualifying rows average; the rule threshold is exactly 3', () => {
    const rows = withScores([
      { overall: { ...fixture.overall, delta: 10, delta_reliable: true } },
      { overall: { ...fixture.overall, delta: 4, delta_reliable: true } },
      { overall: { ...fixture.overall, delta: 7, delta_reliable: true } },
    ]);
    expect(reliableGrowthAverage(rows)).toEqual({ state: 'average', value: 7, qualifying: 3 });
  });

  test('growth is read from overall, never from history — a row with omitted history still aggregates', () => {
    const { history: _history, ...rosterRow } = fixture;
    const rows = withScores([
      { ...(rosterRow as ResultView), overall: { ...fixture.overall, delta: 6, delta_reliable: true } },
      { ...(rosterRow as ResultView), overall: { ...fixture.overall, delta: 8, delta_reliable: true } },
      { ...(rosterRow as ResultView), overall: { ...fixture.overall, delta: 10, delta_reliable: true } },
    ]);
    expect(reliableGrowthAverage(rows)).toEqual({ state: 'average', value: 8, qualifying: 3 });
  });
});

describe('phaseSpread — null phase has its own bucket (D17)', () => {
  test('counts per phase and never folds a null phase into a named one', () => {
    const rows = withScores([
      { acara_phase: 'developing' },
      { acara_phase: 'developing' },
      { acara_phase: 'consolidating' },
      { acara_phase: null }, // Decoding never assessed: no phase, its own bucket
    ]);
    const spread = phaseSpread(rows);
    expect(spread).toEqual([
      { phase: 'developing', count: 2 },
      { phase: 'consolidating', count: 1 },
      { phase: null, count: 1 },
    ]);
  });

  test('an empty roster yields an empty spread', () => {
    expect(phaseSpread([])).toEqual([]);
  });
});

describe('scoredCount — an actual overall score, not a present row', () => {
  test('counts scored rows against the roster total', () => {
    const rows = withScores([
      { overall: { ...fixture.overall, domain_score: 80 } },
      { overall: { ...fixture.overall, domain_score: null } },
      { overall: { ...fixture.overall, domain_score: 55 } },
    ]);
    expect(scoredCount(rows)).toEqual({ scored: 2, total: 3 });
    expect(scoredCount([])).toEqual({ scored: 0, total: 0 });
  });
});

/* ──────────────────────────────────────────────────────────────────────────
 * Task 34 (scoped) — Screen B's five pure additions. Same fixture discipline:
 * the real contract payload mutated into multiple students, every exclusion
 * rule asserted by name.
 * ────────────────────────────────────────────────────────────────────────── */

import { needsSupport, secureCounts, subskillAverages, topGains, vocabStrandMeans } from '@/modules/results/lib/class-aggregation';

describe('subskillAverages — per-skill means with their own denominator', () => {
  test('averages each skill over the students who have it assessed, and counts the excluded', () => {
    const rows = withScores([
      { overall: { ...fixture.overall, domain_score: 80 } }, // fixture attributes: Decoding 92, Vocab blend 76, Grammar 72, Detail 74, Inference 80, gate 70
      { overall: { ...fixture.overall, domain_score: 60 }, attributes: { ...fixture.attributes, Grammar: { status: 'not_assessed', items_seen: 0 } } },
    ]);
    const averages = subskillAverages(rows);
    const bySkill = new Map(averages.map((a) => [a.skill, a]));
    expect(bySkill.get('Decoding')).toEqual({ skill: 'Decoding', average: 92, assessed: 2, excluded: 0 });
    expect(bySkill.get('Grammar')).toEqual({ skill: 'Grammar', average: 72, assessed: 1, excluded: 1 });
    // D13 per-function: Critical's gate score averages WITHIN itself…
    expect(bySkill.get('Critical')).toEqual({ skill: 'Critical', average: 70, assessed: 2, excluded: 0 });
    // …and the canonical order holds, Gist (never assessed) absent.
    expect(averages.map((a) => a.skill)).toEqual(['Decoding', 'Vocabulary', 'Grammar', 'Detail', 'Inference', 'Critical']);
  });
});

describe('secureCounts — counted as sent, Critical absent by construction', () => {
  test('counts status === "secure" per banded skill and NEVER recomputes from a score', () => {
    const highScoreDeveloping = rescored(fixture.attributes.Decoding!, 95, 'developing');
    const rows = withScores([
      { overall: { ...fixture.overall, domain_score: 80 }, attributes: { ...fixture.attributes, Decoding: highScoreDeveloping } },
      { overall: { ...fixture.overall, domain_score: 60 }, vocab: { ...fixture.vocab, status: 'developing' as const } },
    ]);
    const counts = secureCounts(rows);
    const bySkill = new Map(counts.map((c) => [c.skill, c]));
    // 95% but the API said developing — the count stays 1, never recomputed.
    expect(bySkill.get('Decoding')).toEqual({ skill: 'Decoding', secure: 1, assessed: 2 });
    // The blend: the second row's API status is developing — counted as sent.
    expect(bySkill.get('Vocabulary')).toEqual({ skill: 'Vocabulary', secure: 1, assessed: 2 });
    expect(counts.map((c) => c.skill)).not.toContain('Critical'); // no band on the gate — no tally
  });
});

describe('vocabStrandMeans — single-strand students are absent from the strand they did not sit', () => {
  test('a2-only, b1-only and dual-strand rows each contribute to exactly their strands', () => {
    const rows = withScores([
      { vocab: { ...fixture.vocab, single_strand: 'a2' as const, a2: { domain_score: 80 }, b1: { domain_score: null } } },
      { vocab: { ...fixture.vocab, single_strand: 'b1' as const, a2: { domain_score: null }, b1: { domain_score: 60 } } },
      { vocab: { ...fixture.vocab, single_strand: null, a2: { domain_score: 90 }, b1: { domain_score: 50 } } },
    ]);
    const means = vocabStrandMeans(rows);
    expect(means.a2).toEqual({ average: 85, assessed: 2 }); // 80 + 90; the b1-only row is ABSENT
    expect(means.b1).toEqual({ average: 55, assessed: 2 }); // 60 + 50; the a2-only row is ABSENT
  });

  test('a single-strand row never contributes a fallback to its missing strand', () => {
    // Even if a numeric value rode along on the unsat strand, the exclusion wins.
    const rows = withScores([
      { vocab: { ...fixture.vocab, single_strand: 'a2' as const, a2: { domain_score: 80 }, b1: { domain_score: 99 } } },
    ]);
    const means = vocabStrandMeans(rows);
    expect(means.b1).toEqual({ average: null, assessed: 0 });
    expect(means.a2).toEqual({ average: 80, assessed: 1 });
  });
});

describe('topGains — reliable numeric deltas desc, capped at 5', () => {
  test('sorts desc, drops band_movement and unreliable deltas, caps at 5', () => {
    const rows = withScores([
      { overall: { ...fixture.overall, delta: 2, delta_reliable: true } },
      { overall: { ...fixture.overall, delta: 12, delta_reliable: true } },
      { overall: { ...fixture.overall, delta: null, delta_reliable: null } },  // band_movement: cannot rank
      { overall: { ...fixture.overall, delta: 30, delta_reliable: false } },  // unreliable: cannot rank
      { overall: { ...fixture.overall, delta: 7, delta_reliable: true } },
      { overall: { ...fixture.overall, delta: 9, delta_reliable: true } },
      { overall: { ...fixture.overall, delta: 5, delta_reliable: true } },
    ]);
    const ranked = topGains(rows);
    expect(ranked).toHaveLength(5); // six reliable rows, capped at five
    const deltas = ranked.map((row) => row.overall.delta);
    expect(deltas).toEqual([12, 9, 7, 5, 2]);
  });
});

describe('needsSupport — a reliable decline outranks low-but-steady', () => {
  test('the ordering is the pedagogical claim, asserted directly', () => {
    const rows = withScores([
      { overall: { ...fixture.overall, domain_score: 45, delta: null, delta_reliable: null } },   // low and steady
      { overall: { ...fixture.overall, domain_score: 61, delta: -8, delta_reliable: true } },     // RELIABLE DECLINE, higher score
      { overall: { ...fixture.overall, domain_score: 38, delta: -5, delta_reliable: false } },    // UNRELIABLE negative: not a decline
      { overall: { ...fixture.overall, domain_score: 30, delta: -3, delta_reliable: true } },     // reliable decline, lower score
    ]);
    const ranked = needsSupport(rows);
    // Both reliable declines first — within them, most negative delta first
    // (the steeper the backslide, the more urgent) — then the rest by score,
    // so the unreliable -5 and the steady 45 trail despite 38's lower score.
    expect(ranked.map((row) => row.overall.domain_score)).toEqual([61, 30, 38, 45]);
  });

  test('unscored rows never rank, and the cap is 5', () => {
    const rows = withScores([
      ...Array.from({ length: 7 }, (_, i) => ({ overall: { ...fixture.overall, domain_score: 40 + i } })),
      { overall: { ...fixture.overall, domain_score: null } },
    ]);
    expect(needsSupport(rows)).toHaveLength(5);
    expect(needsSupport(rows)[0]?.overall.domain_score).toBe(40);
  });
});
