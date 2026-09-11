import { describe, expect, test } from 'vitest';

import { STUDENT_CATALOGS, studentTranslators } from '@/modules/teacher/lib/__fixtures__/student-translators';
import {
  overallDeltaText,
  progressTiles,
  strandsText,
  studentAnalysis,
  subskillDeltaText,
} from '@/modules/teacher/lib/student-detail-text';
import { firstNameOf, resolveParagraphs, resolveStudentText } from '@/modules/teacher/lib/student-text';
import { t2Result, t2ResultAmara, t2ResultDilnoza } from '@/modules/teacher/lib/v2/__fixtures__/t2';
import { studentDetail } from '@/modules/teacher/lib/v2/student-detail';
import type { TextDescriptor } from '@/modules/teacher/types/student-drill-down.types';
import type { StudentDetailView } from '@/modules/teacher/types/v2-student-detail.types';

function descriptorsOf(view: StudentDetailView, first: string): TextDescriptor[] {
  const tiles = progressTiles(view).flatMap((tile) => (tile.value === null ? [tile.label] : [tile.label, tile.value]));
  const cards = view.subskills.flatMap((card) => [subskillDeltaText(card.delta), strandsText(card.strands)]);
  const overall = overallDeltaText(view.overall.growth);
  return [...tiles, ...cards, overall, ...studentAnalysis(view, first).flat()].filter(
    (descriptor): descriptor is TextDescriptor => descriptor !== null,
  );
}

const en = studentTranslators('en');

describe('student page text — recorded Dilnoza, en', () => {
  const view = studentDetail(t2ResultDilnoza);
  const text = (descriptor: TextDescriptor) => resolveStudentText(descriptor, en);

  test('tiles print the sitting month, the percent and the server step', () => {
    expect(progressTiles(view).map((tile) => [text(tile.label), tile.value === null ? null : text(tile.value)])).toEqual([
      ['Baseline (Sep)', '76%'],
      ['Latest (Sep)', '41%'],
      ['Growth', '−45 pts'],
      ['Sittings', '8 since Sep'],
    ]);
  });

  test('overall chip, band movement, points movement and strands', () => {
    const card = (skill: string) => view.subskills.find((entry) => entry.skill === skill);
    expect(text(overallDeltaText(view.overall.growth) ?? { key: 'missing' })).toBe('↓ −45 pts');
    expect(text(subskillDeltaText(card('Decoding')?.delta ?? { kind: 'none' }) ?? { key: 'missing' })).toBe('Secure → Not yet');
    expect(text(subskillDeltaText(card('Vocabulary')?.delta ?? { kind: 'none' }) ?? { key: 'missing' })).toBe('↓ −65');
    expect(text(strandsText(card('Vocabulary')?.strands ?? null) ?? { key: 'missing' })).toBe('A2 25% · B1 25%');
  });

  test('analysis: phase label verbatim, skill labels lower-cased, reliable fall', () => {
    expect(resolveParagraphs(studentAnalysis(view, 'Dilnoza'), en)).toEqual([
      'Dilnoza’s overall reading score is 41%, placing them in the Beginning phase of the ACARA English progression. ' +
        'Since the first sitting their reading has fallen 45 points — a reliable drop that exceeds measurement error.',
      'Dilnoza’s strongest area is inference (49%), while decoding (25%) is the clearest focus. ' +
        'Targeted work on decoding — with texts pitched just beyond Dilnoza’s current level — is likely to move the overall score most.',
      'Everyday vocabulary is at A2 25% and academic vocabulary at B1 25%.',
    ]);
  });
});

describe('student page text — recorded Amara, en', () => {
  test('"steady" comes from the view-model catalog, and the analysis says it held steady', () => {
    const view = studentDetail(t2ResultAmara);
    expect(resolveStudentText(overallDeltaText(view.overall.growth) ?? { key: 'missing' }, en)).toBe('steady');
    expect(resolveParagraphs(studentAnalysis(view, 'Amara'), en)[0]).toBe(
      'Amara’s overall reading score is 42%, placing them in the Beginning phase of the ACARA English progression. ' +
        'Their reading has held steady since the first sitting, within measurement error.',
    );
  });
});

describe('student page text — every locale resolves every sentence the recorded rows produce', () => {
  const views: Array<[string, StudentDetailView]> = [
    ['Dilnoza', studentDetail(t2ResultDilnoza)],
    ['Amara', studentDetail(t2ResultAmara)],
    ['Rosa', studentDetail(t2Result('Rosa'))],
    ['Jae-won', studentDetail(t2Result('Jae-won'))],
    ['Lucia', studentDetail(t2Result('Lucia'))],
  ];

  test.each(Object.keys(STUDENT_CATALOGS))('%s: no missing message and no unfilled placeholder', (locale) => {
    const translate = studentTranslators(locale);
    for (const [first, view] of views) {
      for (const descriptor of descriptorsOf(view, first)) {
        const sentence = resolveStudentText(descriptor, translate);
        expect(sentence, `${locale} ${first} ${descriptor.key}`).not.toMatch(/[{}]/);
        expect(sentence.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('student page text — a band "movement" inside one band', () => {
  test('reads as flat "±0", never "Not yet → Not yet"', () => {
    const derived = JSON.parse(JSON.stringify(t2ResultDilnoza)) as typeof t2ResultDilnoza;
    Object.assign(derived.attributes.Decoding ?? {}, { band_before: 'not_yet', band_after: 'not_yet' });
    const decoding = studentDetail(derived).subskills.find((card) => card.skill === 'Decoding');
    expect(resolveStudentText(subskillDeltaText(decoding?.delta ?? { kind: 'none' }) ?? { key: 'missing' }, en)).toBe('±0');
  });
});

describe('firstNameOf', () => {
  test('the first word of the roster name', () => {
    expect(firstNameOf('Jae-won Park')).toBe('Jae-won');
    expect(firstNameOf('  Amara   Okafor ')).toBe('Amara');
    expect(firstNameOf('Dilnoza')).toBe('Dilnoza');
  });
});
