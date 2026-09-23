import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, test } from 'vitest';

import { resultViewSchema } from '@schooltest/scoring-contracts';

import { buildFamilyPreview, familyPhraseKey } from '@/modules/report/lib/parent-view-model';

/**
 * Task 35 — the family-preview view model, over the REAL v2 fixture (not the
 * golden/ directory — those twenty files are score-resp/1 R outputs). The
 * allow-list is the task: the model yields EXACTLY the allowed keys, so a new
 * field added upstream is excluded by default rather than included by accident.
 */

const view = resultViewSchema.parse(
  JSON.parse(
    readFileSync(resolve(process.cwd(), 'vendor/contracts/scoring/fixtures/result-view.json'), 'utf8'),
  ),
);

describe('the allow-list view model (task 35)', () => {
  test('yields EXACTLY the allowed keys — nothing upstream flows through', () => {
    const model = buildFamilyPreview(view);
    expect(Object.keys(model).sort()).toEqual([
      'nextSteps', 'overall', 'phase', 'publishedAt', 'skill', 'strengths', 'subskills',
    ]);
    expect(Object.keys(model.overall)).toEqual(['score']);
    expect(Object.keys(model.phase)).toEqual(['label']);
    // The Academic Vocabulary entry alone also carries its band (its §8 phrase).
    const academicKey = (skill: string) => (skill === 'Vocab_B2' ? ['academicBand'] : []);
    for (const strength of model.strengths) {
      expect(Object.keys(strength).sort()).toEqual([...academicKey(strength.skill), 'score', 'skill', 'state']);
    }
    for (const step of model.nextSteps) {
      expect(
        Object.keys(step).sort(),
      ).toEqual(step.kind === 'focus' ? [...academicKey(step.skill), 'kind', 'score', 'skill', 'state'] : ['kind']);
    }
    expect([...Object.keys(model.subskills)].sort()).toEqual(['groups', 'state', 'total']);
    // The audit fields stay OUT of the emitted object entirely, and the model
    // carries NO interpolated copy — rendering strings are locale keys applied
    // in the component, never here.
    expect(JSON.stringify(model)).not.toMatch(/prob|theta|"se"|low_confidence|readiness|cefr/i);
    expect(JSON.stringify(model)).not.toMatch(/practice at home|uses this skill|getting there/i);
  });

  test('strengths are the top-2 ASSESSED banded skills; not-assessed is never one', () => {
    const { strengths } = buildFamilyPreview(view);
    // Decoding 92 and Vocab_A2 90 lead; Gist (not assessed) and Critical (not an attribute) absent.
    expect(strengths).toEqual([
      { skill: 'Decoding', score: 92, state: 'secure' },
      { skill: 'Vocab_A2', score: 90, state: 'secure' },
    ]);
    expect(strengths.map((s) => s.skill)).not.toContain('Gist');
    expect(strengths.map((s) => s.skill)).not.toContain('Critical');
  });

  test('next steps name the lowest assessed banded skill; not-assessed is never the focus', () => {
    const { nextSteps } = buildFamilyPreview(view);
    expect(nextSteps[0]).toEqual({
      kind: 'focus',
      skill: 'Vocab_B1',
      score: 54,
      state: 'getting_there',
    });
    expect(nextSteps[1]).toEqual({ kind: 'practice' });
    expect(nextSteps.map((s) => (s.kind === 'focus' ? s.skill : ''))).not.toContain('Gist');
  });

  test('with nothing assessed there are no strengths and NO invented advice', () => {
    const attributes = Object.fromEntries(
      Object.keys(view.attributes).map((key) => [key, { status: 'not_assessed' as const, items_seen: 0 }]),
    );
    const academic_vocab = { ...view.academic_vocab, domain_score: null, se: null, band: null };
    const model = buildFamilyPreview({ ...view, attributes, academic_vocab });
    expect(model.strengths).toEqual([]);
    expect(model.nextSteps).toEqual([]);
    expect(model.subskills.groups).toEqual([
      { state: 'not_assessed', count: 8 },
    ]);
  });

  test('the family tone collapses developing and emerging to one positive step', () => {
    const model = buildFamilyPreview(view);
    // Vocab_A2 secure, Vocab_B1 emerging, Academic (Vocab_B2) developing, Gist not assessed:
    expect(model.subskills.groups).toEqual([
      { state: 'secure', count: 4 },        // Decoding, Vocab_A2, Detail, Inference
      { state: 'getting_there', count: 3 }, // Grammar developing + Vocab_B1 emerging + Academic developing
      { state: 'not_assessed', count: 1 },  // Gist
    ]);
    // Grammar (developing) lands in the same family step as Vocab_B1 (emerging):
    const detail = model.strengths.find((s) => s.skill === 'Decoding');
    expect(detail?.state).toBe('secure');
  });
});

describe('Academic Vocabulary — the third vocabulary skill (spec 4 §7)', () => {
  const strand = (band: 'secure' | 'developing' | 'emerging' | 'not_yet' | null, score: number | null) => ({
    ...view.academic_vocab,
    band,
    domain_score: score,
  });

  test('a top score makes it a strength, on the same three-step family state, carrying its band', () => {
    const model = buildFamilyPreview({ ...view, academic_vocab: strand('secure', 95) });
    expect(model.strengths[0]).toEqual({ skill: 'Vocab_B2', score: 95, state: 'secure', academicBand: 'secure' });
    expect(model.subskills.total).toBe(8);
  });

  test('the lowest score makes it the focus; developing and emerging both read "getting there"', () => {
    for (const band of ['developing', 'emerging'] as const) {
      const { nextSteps } = buildFamilyPreview({ ...view, academic_vocab: strand(band, 40) });
      expect(nextSteps[0]).toEqual({ kind: 'focus', skill: 'Vocab_B2', score: 40, state: 'getting_there', academicBand: band });
    }
  });

  test('no band (not reached, or no cuts) is not assessed: never a strength or focus, counted as a gap', () => {
    for (const academic_vocab of [strand(null, null), strand(null, 99), strand(null, 10)]) {
      const model = buildFamilyPreview({ ...view, academic_vocab });
      const named = [...model.strengths.map((s) => s.skill), ...model.nextSteps.map((s) => (s.kind === 'focus' ? s.skill : ''))];
      expect(named).not.toContain('Vocab_B2');
      expect(model.subskills.groups.find((g) => g.state === 'not_assessed')?.count).toBe(2); // Gist + Academic
    }
  });

  test('a wire without the strand (the C-PAR-REPORT family view) has no Academic entry at all', () => {
    const model = buildFamilyPreview({ ...view, academic_vocab: undefined });
    expect(model.subskills.total).toBe(7);
    expect(JSON.stringify(model)).not.toContain('Vocab_B2');
  });

  test('its phrase is the §8 register line for its four-step band; every other skill keeps the family phrase', () => {
    expect(familyPhraseKey({ state: 'getting_there', academicBand: 'emerging' })).toBe('academicVocabBand.emerging');
    expect(familyPhraseKey({ state: 'not_yet', academicBand: 'not_yet' })).toBe('academicVocabBand.not_yet');
    expect(familyPhraseKey({ state: 'secure' })).toBe('parentStatePhrase.secure');
  });
});
