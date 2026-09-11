import { describe, expect, test } from 'vitest';

import { STUDENT_ASK_TOPICS } from '@/modules/teacher/constants/student-ask.constants';
import { STUDENT_CATALOGS, studentTranslators } from '@/modules/teacher/lib/__fixtures__/student-translators';
import { askIntentOf, studentAnswer } from '@/modules/teacher/lib/student-ask';
import { studentAnalysis } from '@/modules/teacher/lib/student-detail-text';
import { resolveParagraphs, resolveStudentText } from '@/modules/teacher/lib/student-text';
import { t2Result, t2ResultDilnoza } from '@/modules/teacher/lib/v2/__fixtures__/t2';
import { studentDetail } from '@/modules/teacher/lib/v2/student-detail';
import type { StudentAskIntent, StudentAskKeywords } from '@/modules/teacher/types/student-ask.types';
import type { StudentTextTranslators, TextDescriptor } from '@/modules/teacher/types/student-drill-down.types';

const keywordsOf = (translate: StudentTextTranslators): StudentAskKeywords => ({
  change: translate.t('ask.keywords.change'),
  focus: translate.t('ask.keywords.focus'),
  vocab: translate.t('ask.keywords.vocab'),
});

describe('askIntentOf — the design’s question router', () => {
  test.each(Object.keys(STUDENT_CATALOGS))('%s: every suggestion chip and its question route to their own topic', (locale) => {
    const translate = studentTranslators(locale);
    const keywords = keywordsOf(translate);
    for (const topic of STUDENT_ASK_TOPICS) {
      expect(askIntentOf(translate.t(`ask.suggest.${topic}`, { first: 'Dilnoza' }), keywords), `${locale} chip ${topic}`).toBe(topic);
      expect(askIntentOf(translate.t(`ask.question.${topic}`, { first: 'Dilnoza' }), keywords), `${locale} ask ${topic}`).toBe(topic);
    }
  });

  test('en free text: focus before vocabulary before change, anything else is the overview', () => {
    const keywords = keywordsOf(studentTranslators('en'));
    const cases: Array<[string, StudentAskIntent]> = [
      ['Why did her score drop?', 'change'],
      ['Which words does she know?', 'vocab'],
      ['What should we work on next with vocabulary?', 'focus'],
      ['Tell me about Dilnoza', 'generic'],
    ];
    for (const [question, intent] of cases) expect(askIntentOf(question, keywords), question).toBe(intent);
  });
});

describe('studentAnswer — recorded Dilnoza', () => {
  const view = studentDetail(t2ResultDilnoza);
  const en = studentTranslators('en');
  const say = (descriptor: TextDescriptor) => resolveStudentText(descriptor, en);
  const analysis = resolveParagraphs(studentAnalysis(view, 'Dilnoza'), en);
  const answer = (intent: StudentAskIntent) => studentAnswer(intent, view, 'Dilnoza');

  test('each topic answers with the analysis card’s own sentences, under the design’s title', () => {
    expect(say(answer('change').title)).toBe('What moved Dilnoza’s score');
    expect(answer('change').body.map(say).join(' ')).toBe(analysis[0]);
    expect(say(answer('focus').title)).toBe('Where to focus next');
    expect(answer('focus').body.map(say).join(' ')).toBe(analysis[1]);
    expect(say(answer('vocab').title)).toBe('Vocabulary picture');
    expect(answer('vocab').body.map(say).join(' ')).toBe(analysis[2]);
  });

  test('the overview is the overall paragraph and the follow-up hint', () => {
    expect(say(answer('generic').title)).toBe('On Dilnoza’s reading');
    expect(answer('generic').body.map(say).join(' ')).toBe(
      `${analysis[0]} Ask about what changed, where to focus next, or their vocabulary for more detail.`,
    );
  });

  test('a topic the result cannot speak to says so instead of guessing (Lucia: no overall score)', () => {
    const lucia = studentDetail(t2Result('Lucia'));
    expect(studentAnswer('change', lucia, 'Lucia').body.map(say)).toEqual([
      'Lucia’s latest form does not carry enough to answer that yet.',
    ]);
  });

  test.each(Object.keys(STUDENT_CATALOGS))('%s: every answer and the grounding note resolve', (locale) => {
    const translate = studentTranslators(locale);
    for (const intent of [...STUDENT_ASK_TOPICS, 'generic'] as const) {
      const built = studentAnswer(intent, view, 'Dilnoza');
      for (const descriptor of [built.title, ...built.body]) {
        expect(resolveStudentText(descriptor, translate), `${locale} ${descriptor.key}`).not.toMatch(/[{}]/);
      }
    }
    for (const count of [0, 1, 8]) {
      expect(translate.t('ask.intro', { first: 'Dilnoza', count }), `${locale} intro ${count}`).not.toMatch(/[{}]/);
    }
  });
});
