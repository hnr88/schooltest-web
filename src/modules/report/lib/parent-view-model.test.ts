import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, test } from 'vitest';

import { resultViewSchema } from '@schooltest/scoring-contracts';

import { buildFamilyPreview } from '@/modules/report/lib/parent-view-model';

/**
 * Task 35 — the family-preview view model, over the REAL v2 fixture (not the
 * golden/ directory — those twenty files are score-resp/1 R outputs). The
 * allow-list is the task: the model yields EXACTLY the allowed keys, so a new
 * field added upstream is excluded by default rather than included by accident.
 */

const view = resultViewSchema.parse(
  JSON.parse(
    readFileSync(resolve(process.cwd(), '../mvp/contracts/scoring/fixtures/result-view.json'), 'utf8'),
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
    for (const strength of model.strengths) {
      expect(Object.keys(strength).sort()).toEqual(['line', 'score', 'skill']);
    }
    for (const step of model.nextSteps) {
      expect(Object.keys(step)).toEqual(['line']);
    }
    expect([...Object.keys(model.subskills)].sort()).toEqual(['groups', 'state', 'total']);
    // The audit fields stay OUT of the emitted object entirely.
    expect(JSON.stringify(model)).not.toMatch(/prob|theta|"se"|low_confidence|readiness|cefr/i);
  });

  test('strengths are the top-2 ASSESSED banded skills; not-assessed is never one', () => {
    const { strengths } = buildFamilyPreview(view);
    // Decoding 92 and Vocab_A2 90 lead; Gist (not assessed) and Critical (not an attribute) absent.
    expect(strengths.map((s) => s.skill)).toEqual(['Decoding', 'Vocab_A2']);
    expect(strengths.map((s) => s.skill)).not.toContain('Gist');
    expect(strengths.map((s) => s.skill)).not.toContain('Critical');
    expect(strengths[0]?.line).toContain('92% — uses this skill reliably');
  });

  test('next steps name the lowest assessed banded skill; not-assessed is never the focus', () => {
    const { nextSteps } = buildFamilyPreview(view);
    expect(nextSteps[0]?.line).toContain('Focus next: Vocab_B1 — 54%');
    expect(nextSteps.map((s) => s.line).join(' ')).not.toContain('Gist');
    expect(nextSteps[1]?.line).toContain('Short, regular reading practice at home');
  });

  test('with nothing assessed there are no strengths and NO invented advice', () => {
    const attributes = Object.fromEntries(
      Object.keys(view.attributes).map((key) => [key, { status: 'not_assessed', items_seen: 0 }]),
    );
    const model = buildFamilyPreview({ ...view, attributes });
    expect(model.strengths).toEqual([]);
    expect(model.nextSteps).toEqual([]);
    expect(model.subskills.groups).toEqual([
      { state: 'not_assessed', count: 7 },
    ]);
  });

  test('the family tone collapses developing and emerging to one positive step', () => {
    const model = buildFamilyPreview(view);
    // Vocab_A2 secure, Vocab_B1 emerging, Gist not assessed:
    expect(model.subskills.groups).toEqual([
      { state: 'secure', count: 4 },       // Decoding, Vocab_A2, Grammar?, no — Grammar developing
      { state: 'getting_there', count: 2 }, // Grammar developing + Vocab_B1 emerging
      { state: 'not_assessed', count: 1 }, // Gist
    ]);
    // Grammar (developing) lands in the same family step as Vocab_B1 (emerging):
    const detail = model.strengths.find((s) => s.skill === 'Decoding');
    expect(detail?.line).toContain('uses this skill reliably');
  });
});
