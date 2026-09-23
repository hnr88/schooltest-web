import { describe, expect, test } from 'vitest';

import { resultViewSchema } from '@schooltest/scoring-contracts';

import { familyCommentaryKeys } from '@/modules/report/lib/family-commentary';
import dilnoza from '@/modules/teacher/lib/v2/__fixtures__/t2-result-dilnoza.json';
import amara from '@/modules/teacher/lib/v2/__fixtures__/t2-result-amara.json';

import en from '@/i18n/messages/en.json';
import ko from '@/i18n/messages/ko.json';
import ms from '@/i18n/messages/ms.json';
import th from '@/i18n/messages/th.json';
import vi from '@/i18n/messages/vi.json';
import zh from '@/i18n/messages/zh.json';

const LOCALES = { en, zh, ms, ko, vi, th } as const;

function message(catalog: (typeof LOCALES)[keyof typeof LOCALES], key: string): string {
  const value = key
    .split('.')
    .reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], catalog.TeacherPortal.viewModel);
  if (typeof value !== 'string') throw new Error(`missing TeacherPortal.viewModel.${key}`);
  return value;
}

// BUG-008 follow-up: the family report's "What this means" rendered the API's English audit
// narrative verbatim ("Vocab_A2: secure — A2-level vocabulary knowledge… (probability 1.00 from 6
// evidence items)"), in every locale. It is now built from the structured attributes.
describe('familyCommentaryKeys — recorded t2 results', () => {
  test('Dilnoza (both strands not yet): one work-on line per assessed skill, in display order', () => {
    const view = resultViewSchema.parse(dilnoza);
    const keys = familyCommentaryKeys(view.attributes);
    expect(keys).toContain('carer.next.vocabA2');
    expect(keys).toContain('carer.next.vocabB1');
    expect(keys.indexOf('carer.next.vocabA2')).toBeLessThan(keys.indexOf('carer.next.vocabB1'));
  });

  test('Amara (Everyday not assessed): no line for the strand that was not assessed', () => {
    const view = resultViewSchema.parse(amara);
    expect(view.attributes.Vocab_A2?.status).toBe('not_assessed');
    const keys = familyCommentaryKeys(view.attributes);
    expect(keys.some((key) => key.endsWith('.vocabA2'))).toBe(false);
    expect(keys.some((key) => key.endsWith('.vocabB1'))).toBe(true);
  });

  test('a secure strand is a can-do line; every line exists in all six locales with no code, CEFR level or probability', () => {
    const keys = familyCommentaryKeys({ Vocab_A2: { status: 'secure' }, Vocab_B1: { status: 'emerging' }, Grammar: { status: 'not_yet' } });
    expect(keys).toEqual(['carer.can.vocabA2', 'carer.next.grammar', 'carer.can.vocabB1']);
    for (const [locale, catalog] of Object.entries(LOCALES)) {
      for (const key of keys) {
        expect(message(catalog, key), `${locale} ${key}`).not.toMatch(/Vocab_|\bA2\b|\bB1\b|probab|\d\.\d\d/i);
      }
    }
    expect(message(zh, 'carer.can.vocabA2')).toBe('理解日常词汇在语境中的含义。');
  });
});
