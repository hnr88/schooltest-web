import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, test } from 'vitest';

import { resultViewSchema, type ResultView } from '@schooltest/scoring-contracts';

import { buildAttributePanel, resolveAcademicVocabRow } from '@/modules/report/lib/attribute-view-model';
import { buildObservations } from '@/modules/report/lib/observations';

// Spec 4 §7 — the teacher report's Academic Vocabulary row, over the contract's own
// ResultView fixture (Academic Vocabulary 61, developing, 12 items).
const fixture: ResultView = resultViewSchema.parse(
  JSON.parse(readFileSync(resolve(process.cwd(), 'vendor/contracts/scoring/fixtures/result-view.json'), 'utf8')),
);

function rowsOf(result: ResultView) {
  const panel = buildAttributePanel(result);
  if (panel.state !== 'rows') throw new Error(`expected rows, got ${panel.state}`);
  return panel;
}

describe('buildAttributePanel — the Academic Vocabulary row', () => {
  test('is appended after the seven CDM rows, so the vocabulary rows read Everyday → Classroom → Academic', () => {
    const names = rowsOf(fixture).rows.map((row) => row.name);
    expect(names).toEqual(['Decoding', 'Vocab_A2', 'Grammar', 'Vocab_B1', 'Gist', 'Detail', 'Inference', 'Vocab_B2']);
    expect(names.filter((name) => name.startsWith('Vocab_'))).toEqual(['Vocab_A2', 'Vocab_B1', 'Vocab_B2']);
  });

  test('is a banded row read from `academic_vocab`, with its evidence and NO delta', () => {
    expect(rowsOf(fixture).rows.at(-1)).toEqual({
      state: 'assessed',
      name: 'Vocab_B2',
      status: 'developing',
      domainScore: 61,
      itemsSeen: 12,
      delta: null,
      deltaReliable: null,
    });
  });

  test('takes the not-assessed arm when the band or the score is null — no score field, never a 0', () => {
    const notReached = { domain_score: null, se: null, band: null, items_seen: 0, provisional_cut: true };
    expect(resolveAcademicVocabRow(notReached)).toEqual({ state: 'not_assessed', name: 'Vocab_B2', itemsSeen: 0 });
    expect(resolveAcademicVocabRow({ ...fixture.academic_vocab, band: null })).toEqual({
      state: 'not_assessed',
      name: 'Vocab_B2',
      itemsSeen: 12,
    });
    const row = rowsOf({ ...fixture, academic_vocab: notReached }).rows.at(-1);
    expect(row).toMatchObject({ state: 'not_assessed', name: 'Vocab_B2' });
    expect(row).not.toHaveProperty('domainScore');
  });

  test('the evidence summary and the observations stay the modelled attributes’ own', () => {
    expect(rowsOf(fixture).evidence).toEqual({ state: 'assessed', assessed: 6, total: 7, minItems: 9, maxItems: 14 });
    const view = buildObservations(fixture);
    if (view.state !== 'observations') throw new Error('expected observations');
    expect(JSON.stringify(view.observations)).not.toContain('Vocab_B2');
  });

  test('an absent attribute map is still the absence, with no Academic row', () => {
    expect(buildAttributePanel({ ...fixture, attributes: {} }).state).not.toBe('rows');
  });
});
