import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, test } from 'vitest';

import { resultViewSchema, type ResultView } from '@schooltest/scoring-contracts';

import { BAND_TONE, GATE_TONE, UNASSESSED_TONE } from '@/modules/teacher/constants/v2-tones.constants';
import { t2ResultDilnoza } from '@/modules/teacher/lib/v2/__fixtures__/t2';
import { subskillCards } from '@/modules/teacher/lib/v2/subskill-cards';

// Spec 4 — the Academic Vocabulary card on the student page, over the contract's own
// ResultView fixture (Academic Vocabulary 61, developing; the gate 70, not passed).
const fixture: ResultView = resultViewSchema.parse(
  JSON.parse(readFileSync(resolve(process.cwd(), 'vendor/contracts/scoring/fixtures/result-view.json'), 'utf8')),
);

function withAcademic(score: number | null, band: ResultView['academic_vocab']['band']): ResultView {
  return { ...fixture, academic_vocab: { ...fixture.academic_vocab, domain_score: score, band } };
}

function cardOf(view: ResultView, skill: string) {
  const found = subskillCards(view).find((card) => card.skill === skill);
  if (found === undefined) throw new Error(`no ${skill} card`);
  return found;
}

describe('subskillCards — Academic Vocabulary (Vocab_B2)', () => {
  test('a four-step banded card read from `academic_vocab`: no gate, no growth', () => {
    expect(cardOf(fixture, 'Vocab_B2')).toMatchObject({
      labelKey: 'attribute.vocabB2',
      blurbKey: 'skillBlurb.vocabB2',
      score: 61,
      band: { band: 'developing', labelKey: 'band.developing', tone: BAND_TONE.developing },
      gate: null,
      barTone: BAND_TONE.developing,
      delta: { kind: 'none' },
      trajectory: [61],
      tag: null,
    });
  });

  test('sits directly before the Critical card, which stays the exit-gate pill', () => {
    const skills = subskillCards(fixture).map((card) => card.skill);
    expect(skills.indexOf('Vocab_B2')).toBe(skills.indexOf('Critical') - 1);
    expect(skills.slice(0, 7)).toEqual(['Decoding', 'Vocab_A2', 'Grammar', 'Vocab_B1', 'Gist', 'Detail', 'Inference']);
    expect(cardOf(fixture, 'Critical')).toMatchObject({
      score: 70,
      band: null,
      gate: { passed: false, labelKey: 'gate.notYet', tone: GATE_TONE.notYet },
    });
  });

  test('every step of the ladder is a band, never a pass/fail state', () => {
    for (const band of ['not_yet', 'emerging', 'developing', 'secure'] as const) {
      const card = cardOf(withAcademic(61, band), 'Vocab_B2');
      expect(card.band?.band).toBe(band);
      expect(card.gate).toBeNull();
    }
  });

  test('a banded skill for Strength/Focus: the lowest score is the focus, the highest the strength', () => {
    expect(cardOf(withAcademic(20, 'not_yet'), 'Vocab_B2').tag?.kind).toBe('focus');
    expect(cardOf(withAcademic(99, 'secure'), 'Vocab_B2').tag?.kind).toBe('strength');
  });

  test('no band or no score is the not-assessed card — never a 0', () => {
    for (const view of [withAcademic(null, null), withAcademic(61, null)]) {
      expect(cardOf(view, 'Vocab_B2')).toMatchObject({ score: null, band: null, gate: null, barTone: UNASSESSED_TONE, tag: null });
    }
  });

  test('a recorded sitting from before the strand (t2 Dilnoza) is a not-assessed card with no trajectory', () => {
    expect(cardOf(t2ResultDilnoza, 'Vocab_B2')).toMatchObject({
      labelKey: 'attribute.vocabB2',
      score: null,
      band: null,
      gate: null,
      barTone: UNASSESSED_TONE,
      delta: { kind: 'none' },
      trajectory: [],
    });
  });
});
