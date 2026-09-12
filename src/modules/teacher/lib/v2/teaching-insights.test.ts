import { GROWTH_FG } from '@/modules/teacher/constants/v2-tones.constants';
import { describe, expect, test } from 'vitest';

import { t2Diagnostic, t2Roster } from '@/modules/teacher/lib/v2/__fixtures__/t2';
import { peerPairings } from '@/modules/teacher/lib/v2/pairings';
import { teachingInsights } from '@/modules/teacher/lib/v2/teaching-insights';

const view = teachingInsights(t2Roster, t2Diagnostic);

describe('teachingInsights — recorded t2 roster and recorded class diagnostic', () => {
  test('the five KPI cards', () => {
    expect(view.kpis).toEqual({
      lastSitting: { satAt: '2026-09-11', formCode: 'SPK-PROG-A-79' },
      classAverage: 41,
      upSinceLast: { value: -9, paired: 4, fg: '#B42318' },
      topGap: { skill: 'Vocabulary', labelKey: 'skill.vocabulary' },
      participation: { percent: 70, scored: 14, total: 20 },
    });
  });

  test('without the diagnostic the form code is unknown, not guessed, and there are no groups', () => {
    const withoutDiagnostic = teachingInsights(t2Roster);
    expect(withoutDiagnostic.kpis.lastSitting).toEqual({ satAt: '2026-09-11', formCode: null });
    expect(withoutDiagnostic.groups).toEqual([]);
  });

  test('reading mastery: fewest secure, then lowest class mean; Critical (a gate, no band) after the ranked skills', () => {
    expect(view.mastery.map((row) => [row.skill, row.mean, row.assessed])).toEqual([
      ['Vocabulary', 25, 12],
      ['Grammar', 25, 11],
      ['Detail', 25, 6],
      ['Decoding', 25, 11],
      ['Gist', 28, 12],
      ['Inference', 36, 9],
      ['Critical', 50, 5],
    ]);
  });

  test('class focus and class strength flags; secure counts come from the API status', () => {
    expect(view.mastery[0]).toMatchObject({
      skill: 'Vocabulary',
      labelKey: 'skill.vocabulary',
      secure: 0,
      gatePassed: null,
      tone: { fg: '#B42318', bg: '#FDEEEC' },
      flag: { kind: 'focus', labelKey: 'flag.classFocus', tone: { fg: '#B42318', bg: '#FDEEEC' } },
    });
    expect(view.mastery[5]).toMatchObject({
      skill: 'Inference',
      flag: { kind: 'strength', labelKey: 'flag.classStrength', tone: { fg: '#1F7A4D', bg: '#E9F6EF' } },
    });
    expect(view.mastery[6]).toMatchObject({ skill: 'Critical', secure: null, gatePassed: 0, flag: null, tone: { fg: '#92610B' } });
    expect(view.mastery.slice(1, 5).every((row) => row.flag === null)).toBe(true);
  });

  test('cohort at a glance: phase spread, ±5 growth, vocabulary strand means', () => {
    expect(view.cohort).toEqual({
      phases: [
        { phase: 'Beginning', labelKey: 'phase.beginning', count: 12, width: 86, fg: '#B42318' },
        { phase: 'Emerging', labelKey: 'phase.emerging', count: 2, width: 14, fg: '#92610B' },
        { phase: 'Developing', labelKey: 'phase.developing', count: 0, width: 0, fg: '#1A3B8B' },
        { phase: 'Consolidating', labelKey: 'phase.consolidating', count: 0, width: 0, fg: '#1F7A4D' },
      ],
      phased: 14,
      growth: { improved: 1, held: 2, slipped: 1, paired: 4 },
      vocab: { a2: 25, a2Assessed: 11, b1: 25, b1Assessed: 12 },
    });
  });

  test('pairings on the class focus: every recorded Vocabulary score is 25, so no pair clears the 12-point gap', () => {
    expect(view.pairings).toEqual({ skill: { skill: 'Vocabulary', labelKey: 'skill.vocabulary' }, pairs: [] });
  });

  test('the pairing rule on recorded Inference scores walks in from both ends, capped at four pairs', () => {
    const pairs = peerPairings(t2Roster, 'Inference').pairs.map((pair) => [
      pair.strong.firstName,
      pair.strong.score,
      pair.support.firstName,
      pair.support.score,
    ]);
    expect(pairs).toEqual([
      ['Oluwaseun', 49, 'Farida', 25],
      ['Mihail', 49, 'Kaveh', 25],
      ['Dilnoza', 49, 'Eitan', 25],
      ['Ines', 49, 'Tenzin', 25],
    ]);
  });

  test('suggested groups come straight from the recorded diagnostic', () => {
    expect(view.groups.map((group) => [group.attribute, group.labelKey, group.count])).toEqual([
      ['Decoding', 'attribute.decoding', 7],
      ['Detail', 'attribute.detail', 1],
      ['Inference', 'attribute.inference', 4],
      ['not_yet_assessed', 'attribute.notYetAssessed', 8],
    ]);
    expect(view.groups[0].members).toEqual(['Eitan B.', 'Farida B.', 'Gia B.', 'Hamza B.', 'Jae-won B.', 'Kaveh B.', 'Tenzin B.']);
  });
});

describe('teachingInsights — empty roster (every recorded row removed): nothing is invented', () => {
  const empty = teachingInsights(t2Roster.slice(0, 0));

  test('KPIs are null, never zero', () => {
    expect(empty.kpis).toEqual({
      lastSitting: { satAt: null, formCode: null },
      classAverage: null,
      upSinceLast: { value: null, paired: 0, fg: GROWTH_FG.none },
      topGap: null,
      participation: { percent: null, scored: 0, total: 0 },
    });
  });

  test('mastery keeps the seven skills in display order with no mean and no flag', () => {
    expect(empty.mastery.map((row) => [row.skill, row.mean, row.secure, row.gatePassed, row.flag])).toEqual([
      ['Decoding', null, null, null, null],
      ['Vocabulary', null, null, null, null],
      ['Grammar', null, null, null, null],
      ['Gist', null, null, null, null],
      ['Detail', null, null, null, null],
      ['Inference', null, null, null, null],
      ['Critical', null, null, null, null],
    ]);
  });

  test('cohort and pairings are empty', () => {
    expect(empty.cohort.phased).toBe(0);
    expect(empty.cohort.growth).toEqual({ improved: 0, held: 0, slipped: 0, paired: 0 });
    expect(empty.cohort.vocab).toEqual({ a2: null, a2Assessed: 0, b1: null, b1Assessed: 0 });
    expect(empty.pairings).toEqual({ skill: null, pairs: [] });
  });
});
