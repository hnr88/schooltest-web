import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, test } from 'vitest';

import { resultViewSchema, type ResultView } from '@schooltest/scoring-contracts';

import {
  classAverage,
  phaseSpread,
  resultViewsOf,
  scoredCount,
  weakestSkill,
} from '@/modules/results/lib/class-aggregation';
import {
  needsSupport,
  secureCounts,
  subskillAverages,
  topGains,
  vocabStrandMeans,
} from '@/modules/results/lib/class-analytics';
import type { RosterRow } from '@/modules/results/types/roster.types';

/**
 * Tasks 33/34 (scoped) — the pure roster aggregation layer, over the REAL
 * contract fixture mutated into multiple students. Each test names its honesty
 * guardrail: not-assessed is never a weak skill, Critical is never comparable,
 * an unscored student is never a zero, band_movement contributes no growth,
 * fewer than three reliable movers is "not enough data", and a null ACARA
 * phase gets its own bucket (D17) instead of folding to the bottom. The roster
 * aggregates take the task 23 WRAPPER (`{ student, result | null }`) so the
 * total is the roster — scoredCount's bare-Array input was the defect that
 * rendered "18 of 18 scored" for a class of 30.
 */

const fixture = resultViewSchema.parse(
  JSON.parse(
    readFileSync(resolve(process.cwd(), 'vendor/contracts/scoring/fixtures/result-view.json'), 'utf8'),
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

/** Roster rows from the same overrides; a `null` entry is a RESULT-LESS student. */
function withRoster(overrides: Array<Partial<ResultView> | null>): RosterRow[] {
  return overrides.map((override, index) => ({
    student: { document_id: `stu-${index}`, name: `Student ${index}`, initials: `S${index}`, eald_flag: false },
    result: override === null ? null : resultViewSchema.parse({ ...fixture, ...override }),
    // scoring/10 added the row-level key. The aggregation layer under test
    // never reads it — this literal only satisfies the widened RosterRow twin.
    release_state: override === null ? 'nosit' : 'released',
  }));
}

describe('weakestSkill — minimum among assessed banded skills only', () => {
  test('picks the lowest assessed score and never a not-assessed or gated skill', () => {
    // The NINE TILES are the comparison set (dashboard §2): Decoding 92,
    // Everyday Vocabulary 90, Grammar 72, Classroom Vocabulary 54, Detail 74,
    // Inference 80, Academic Vocabulary 61 — Gist is the not-assessed gap and
    // Critical is the gated tile, both excluded. Classroom Vocabulary is its own skill, so its gap
    // shows rather than hiding inside a blend.
    expect(weakestSkill(fixture)).toEqual({ skill: 'Vocab_B1', score: 54 });
  });

  test('ties break to canonical display order (Grammar before Detail at equal scores)', () => {
    // Grammar and Detail tie at 54 — Grammar precedes Detail in canonical tile
    // order (Decoding, Vocab_A2, Grammar, Vocab_B1, Gist, Detail, Inference), so the
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
      vocab: { a2: { domain_score: null }, b1: { domain_score: null } },
      academic_vocab: { domain_score: null, se: null, band: null, items_seen: 0, provisional_cut: true },
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

describe('resultViewsOf — the one unwrap the scored-only aggregates are fed from', () => {
  test('keeps every scored view in roster order and drops result-less students', () => {
    const rows = withRoster([
      { overall: { ...fixture.overall, domain_score: 80 } },
      null, // no official result: absent from every scored-only aggregate
      { overall: { ...fixture.overall, domain_score: 60 } },
    ]);
    expect(resultViewsOf(rows).map((view) => view.overall.domain_score)).toEqual([80, 60]);
  });
});

describe('phaseSpread — null phase has its own bucket (D17), over the whole roster', () => {
  test('counts per phase and never folds a null phase into a named one', () => {
    const rows = withRoster([
      { acara_phase: 'developing' },
      { acara_phase: 'developing' },
      { acara_phase: 'consolidating' },
      { acara_phase: null }, // no measured phase: its own bucket
    ]);
    const spread = phaseSpread(rows);
    expect(spread).toEqual([
      { phase: 'developing', count: 2 },
      { phase: 'consolidating', count: 1 },
      { phase: null, count: 1 },
    ]);
  });

  test('a result-less student lands in the null bucket — the roster total is preserved (task 33 decision)', () => {
    // Excluding them would shrink the chart below the roster — scoredCount's
    // exact defect. The bucket means "no ACARA phase measured", true both ways.
    const rows = withRoster([
      { acara_phase: 'developing' },
      null,
      null,
    ]);
    // Count desc: the null bucket (2) outranks the single developing row.
    expect(phaseSpread(rows)).toEqual([
      { phase: null, count: 2 },
      { phase: 'developing', count: 1 },
    ]);
  });

  test('an empty roster yields an empty spread', () => {
    expect(phaseSpread([])).toEqual([]);
  });
});

describe('scoredCount — scored over the ROSTER total, never over students-with-results', () => {
  test('counts actual overall scores against every roster student', () => {
    const rows = withRoster([
      { overall: { ...fixture.overall, domain_score: 80 } },
      { overall: { ...fixture.overall, domain_score: null } }, // a result, but no score: not scored
      { overall: { ...fixture.overall, domain_score: 55 } },
    ]);
    expect(scoredCount(rows)).toEqual({ scored: 2, total: 3 });
    expect(scoredCount([])).toEqual({ scored: 0, total: 0 });
  });

  test('the denominator defect, as a regression: 18 scored in a class of 30 reads 18 of 30', () => {
    const rows = withRoster([
      ...Array.from({ length: 18 }, () => ({ overall: { ...fixture.overall, domain_score: 70 } })),
      ...Array.from({ length: 12 }, () => null), // twelve students with no official result at all
    ]);
    expect(scoredCount(rows)).toEqual({ scored: 18, total: 30 });
  });
});

/* ──────────────────────────────────────────────────────────────────────────
 * Task 34 (scoped) — Screen B's five pure additions (class-analytics.ts).
 * Same fixture discipline: the real contract payload mutated into multiple
 * students, every exclusion rule asserted by name.
 * ────────────────────────────────────────────────────────────────────────── */

describe('subskillAverages — per-skill means with their own denominator', () => {
  test('averages each skill over the students who have it assessed, and counts the excluded', () => {
    const rows = withScores([
      { overall: { ...fixture.overall, domain_score: 80 } }, // fixture attributes: Decoding 92, Vocab_A2 90, Grammar 72, Vocab_B1 54, Detail 74, Inference 80, Academic 61, gate 70
      { overall: { ...fixture.overall, domain_score: 60 }, attributes: { ...fixture.attributes, Grammar: { status: 'not_assessed', items_seen: 0 } } },
    ]);
    const averages = subskillAverages(rows);
    const bySkill = new Map(averages.map((a) => [a.skill, a]));
    expect(bySkill.get('Decoding')).toEqual({ skill: 'Decoding', average: 92, assessed: 2, excluded: 0 });
    expect(bySkill.get('Grammar')).toEqual({ skill: 'Grammar', average: 72, assessed: 1, excluded: 1 });
    // D13 per-function: Critical's gate score averages WITHIN itself…
    expect(bySkill.get('Critical')).toEqual({ skill: 'Critical', average: 70, assessed: 2, excluded: 0 });
    // …and the canonical order holds, Gist (never assessed) absent.
    expect(averages.map((a) => a.skill)).toEqual(['Decoding', 'Vocab_A2', 'Grammar', 'Vocab_B1', 'Detail', 'Inference', 'Vocab_B2', 'Critical']);
  });
});

describe('secureCounts — counted as sent, Critical absent by construction', () => {
  test('counts status === "secure" per banded skill and NEVER recomputes from a score', () => {
    const highScoreDeveloping = rescored(fixture.attributes.Decoding!, 95, 'developing');
    const rows = withScores([
      { overall: { ...fixture.overall, domain_score: 80 }, attributes: { ...fixture.attributes, Decoding: highScoreDeveloping } },
      { overall: { ...fixture.overall, domain_score: 60 }, attributes: { ...fixture.attributes, Vocab_A2: rescored(fixture.attributes.Vocab_A2!, 90, 'developing') } },
    ]);
    const counts = secureCounts(rows);
    const bySkill = new Map(counts.map((c) => [c.skill, c]));
    // 95% but the API said developing — the count stays 1, never recomputed.
    expect(bySkill.get('Decoding')).toEqual({ skill: 'Decoding', secure: 1, assessed: 2 });
    // Everyday Vocabulary: the second row's API status is developing — counted as sent.
    expect(bySkill.get('Vocab_A2')).toEqual({ skill: 'Vocab_A2', secure: 1, assessed: 2 });
    // Classroom Vocabulary is tallied on its own — emerging in both rows.
    expect(bySkill.get('Vocab_B1')).toEqual({ skill: 'Vocab_B1', secure: 0, assessed: 2 });
    expect(counts.map((c) => c.skill)).not.toContain('Critical'); // no band on the gate — no tally
  });

  test('a not-assessed vocabulary strand is not counted as assessed', () => {
    const rows = withScores([
      { overall: { ...fixture.overall, domain_score: 80 } },
      {
        overall: { ...fixture.overall, domain_score: null },
        attributes: { ...fixture.attributes, Vocab_B1: { status: 'not_assessed', items_seen: 0 } },
        vocab: { ...fixture.vocab, b1: { domain_score: null } },
      },
    ]);
    const classroom = secureCounts(rows).find((c) => c.skill === 'Vocab_B1');
    expect(classroom?.assessed).toBe(1);
  });
});

describe('vocabStrandMeans — students are absent from a strand they did not sit', () => {
  test('a2-only, b1-only and dual-strand rows each contribute to exactly their strands', () => {
    const rows = withScores([
      { vocab: { a2: { domain_score: 80 }, b1: { domain_score: null } } },
      { vocab: { a2: { domain_score: null }, b1: { domain_score: 60 } } },
      { vocab: { a2: { domain_score: 90 }, b1: { domain_score: 50 } } },
    ]);
    const means = vocabStrandMeans(rows);
    expect(means.a2).toEqual({ average: 85, assessed: 2 }); // 80 + 90; the b1-only row is ABSENT
    expect(means.b1).toEqual({ average: 55, assessed: 2 }); // 60 + 50; the a2-only row is ABSENT
  });

  test('an unsat strand never contributes a fallback', () => {
    const rows = withScores([{ vocab: { a2: { domain_score: 80 }, b1: { domain_score: null } } }]);
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
      // Mixed delta directions: null-delta rows are not reliable gainers, so
      // every one of these seven ranks — the cap is what limits the list to 5.
      ...Array.from({ length: 7 }, (_, i) => ({
        overall: { ...fixture.overall, domain_score: 40 + i, delta: null, delta_reliable: null },
      })),
      { overall: { ...fixture.overall, domain_score: null, delta: null, delta_reliable: null } },
    ]);
    expect(needsSupport(rows)).toHaveLength(5);
    expect(needsSupport(rows)[0]?.overall.domain_score).toBe(40);
    expect(needsSupport(rows).map((row) => row.overall.domain_score)).toEqual([40, 41, 42, 43, 44]);
  });

  // ops/34 — the row-scoped delta rule (orchestrator-requested construct): a
  // reliable GAINER never ranks in needs support, a reliable DECLINE always
  // does and ranks first, and each row is judged on ITS OWN delta — the
  // class's improving students never hide a struggling one.
  test('a reliable gainer never ranks in needs support; a reliable decline always does', () => {
    const rows = withScores([
      { overall: { ...fixture.overall, domain_score: 80, delta: 13, delta_reliable: true } },
      { overall: { ...fixture.overall, domain_score: 82, delta: 14, delta_reliable: true } },
      { overall: { ...fixture.overall, domain_score: 45, delta: -6, delta_reliable: true } },
      { overall: { ...fixture.overall, domain_score: null, delta: null, delta_reliable: null } },
    ]);
    const ranked = needsSupport(rows);
    // The exclusion is the semantics: the +13/+14 reliable gainers belong to
    // the gains list; only the decline ranks in needs support.
    expect(ranked.map((row) => row.overall.delta)).toEqual([-6]);
    // The gainer is ranked LAST (by score), never celebrated here — but the
    // gains list owns it, and the gains list must not carry the decline.
    const gains = topGains(rows);
    expect(gains.map((row) => row.overall.delta)).toEqual([14, 13]);
    expect(gains.map((row) => row.overall.delta)).not.toContain(-6);
  });
});
