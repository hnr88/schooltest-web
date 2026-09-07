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
        Grammar: { ...fixture.attributes.Grammar!, domain_score: 54, status: 'emerging' as const },
        Detail: { ...fixture.attributes.Detail!, domain_score: 54, status: 'emerging' as const },
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
