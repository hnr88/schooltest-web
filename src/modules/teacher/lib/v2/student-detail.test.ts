import { GROWTH_FG } from '@/modules/teacher/constants/v2-tones.constants';
import { describe, expect, test } from 'vitest';

import type { DisplaySkill } from '@schooltest/scoring-contracts';

import { t2ResultAmara, t2ResultDilnoza } from '@/modules/teacher/lib/v2/__fixtures__/t2';
import { sparkline } from '@/modules/teacher/lib/v2/chart-geometry';
import { studentDetail } from '@/modules/teacher/lib/v2/student-detail';
import type { StudentDetailView, SubskillCard } from '@/modules/teacher/types/v2-student-detail.types';

const RED = { fg: '#B42318', bg: '#FDEEEC' };
const AMBER = { fg: '#92610B', bg: '#FDF4E3' };
const UNASSESSED = { fg: '#5B6472', bg: '#F1F3F6' };

function card(view: StudentDetailView, skill: DisplaySkill): SubskillCard {
  const found = view.subskills.find((entry) => entry.skill === skill);
  if (found === undefined) throw new Error(`no ${skill} card`);
  return found;
}

describe('studentDetail — recorded Dilnoza (GET /results/:id, 8 sittings, 3 scored)', () => {
  const view = studentDetail(t2ResultDilnoza);

  test('overall score, server growth and server phase', () => {
    expect(view.resultDocumentId).toBe('gdijynxot3d31d0pt053jv37');
    expect(view.overall).toEqual({
      score: 41,
      growth: { kind: 'down', delta: -43, points: -45, reliable: true, fg: '#B42318' },
    });
    expect(view.phase).toMatchObject({ phase: 'Beginning', source: 'server', subLabelKey: 'phaseSub.beginning' });
  });

  test('the series keeps the recorded ordinals of the scored sittings only', () => {
    expect(view.series).toEqual([
      { n: 6, satAt: '2026-09-10', value: 76 },
      { n: 7, satAt: '2026-09-10', value: 84 },
      { n: 8, satAt: '2026-09-10', value: 41 },
    ]);
    expect(view.chart.points.map((point) => point.value)).toEqual([76, 84, 41]);
  });

  test('baseline, latest, growth and sittings tiles', () => {
    expect(view.tiles).toEqual({
      baseline: { n: 6, satAt: '2026-09-10', value: 76 },
      latest: { value: 41, satAt: '2026-09-10' },
      growth: view.overall.growth,
      span: { from: 76, to: 41, difference: -35 },
      sittings: { count: 8, since: '2026-09-10' },
    });
  });

  test('seven subskill cards in display order', () => {
    expect(view.subskills.map((entry) => entry.skill)).toEqual([
      'Decoding',
      'Vocabulary',
      'Grammar',
      'Gist',
      'Detail',
      'Inference',
      'Critical',
    ]);
  });

  test('Decoding: API band, band movement down, the focus area', () => {
    expect(card(view, 'Decoding')).toEqual({
      skill: 'Decoding',
      labelKey: 'skill.decoding',
      blurbKey: 'skillBlurb.decoding',
      score: 25,
      band: { band: 'not_yet', labelKey: 'band.notYet', tone: RED },
      gate: null,
      barTone: RED,
      delta: { kind: 'bands', before: 'secure', after: 'not_yet', fg: '#B42318' },
      trajectory: [90, 90, 25],
      spark: sparkline([90, 90, 25]),
      tag: { kind: 'focus', labelKey: 'tag.focusArea', tone: AMBER },
      strands: null,
    });
  });

  test('Vocabulary: the reliable "-65" and both strands', () => {
    expect(card(view, 'Vocabulary')).toMatchObject({
      score: 25,
      delta: { kind: 'points', points: -65, fg: '#B42318' },
      trajectory: [90, 90, 25],
      strands: { a2: 25, b1: 25 },
      tag: null,
    });
  });

  test('Inference: emerging, and the strongest subskill', () => {
    expect(card(view, 'Inference')).toMatchObject({
      score: 49,
      band: { band: 'emerging', labelKey: 'band.emerging', tone: AMBER },
      trajectory: [90, 49],
      tag: { kind: 'strength', labelKey: 'tag.strength', tone: { fg: '#1F7A4D', bg: '#E9F6EF' } },
    });
  });

  test('Critical: no gate score on the latest sitting, so no band, no gate and no movement', () => {
    expect(card(view, 'Critical')).toMatchObject({
      score: null,
      band: null,
      gate: null,
      barTone: UNASSESSED,
      delta: { kind: 'none' },
      trajectory: [86],
      tag: null,
    });
  });

  test('analysis values', () => {
    expect(view.analysis).toEqual({
      strongest: { skill: 'Inference', labelKey: 'skill.inference', score: 49 },
      weakest: { skill: 'Decoding', labelKey: 'skill.decoding', score: 25 },
      vocab: { a2: 25, b1: 25 },
    });
  });
});

describe('studentDetail — recorded Amara (single-strand vocabulary, scored gate)', () => {
  const view = studentDetail(t2ResultAmara);

  test('the Critical card reads the gate', () => {
    expect(card(view, 'Critical')).toMatchObject({
      score: 47,
      band: null,
      gate: { passed: false, labelKey: 'gate.notYet', tone: AMBER },
      barTone: AMBER,
      trajectory: [47, 47, 40, 47],
    });
  });

  test('a single-strand student shows no A2 strand; the steady vocabulary is steady', () => {
    expect(card(view, 'Vocabulary')).toMatchObject({ strands: { a2: null, b1: 25 }, delta: { kind: 'steady', fg: GROWTH_FG.steady } });
  });

  test('not-assessed skills carry no score, band, movement or trajectory', () => {
    for (const skill of ['Decoding', 'Grammar'] as const) {
      expect(card(view, skill)).toMatchObject({ score: null, band: null, delta: { kind: 'none' }, trajectory: [], barTone: UNASSESSED });
    }
  });

  test('band movement inside the same band is flat', () => {
    expect(card(view, 'Gist').delta).toEqual({ kind: 'bands', before: 'not_yet', after: 'not_yet', fg: '#5B6472' });
  });

  test('strength and focus tags', () => {
    expect(card(view, 'Gist').tag?.kind).toBe('strength');
    expect(card(view, 'Vocabulary').tag?.kind).toBe('focus');
  });

  test('overall is steady and the phase comes from the score cut', () => {
    expect(view.overall.growth.kind).toBe('steady');
    expect(view.phase).toMatchObject({ phase: 'Beginning', source: 'score' });
  });

  test('tiles', () => {
    expect(view.tiles).toMatchObject({
      baseline: { n: 4, satAt: '2026-09-10', value: 42 },
      latest: { value: 42, satAt: '2026-09-11' },
      span: { from: 42, to: 42, difference: 0 },
      sittings: { count: 8, since: '2026-09-10' },
    });
  });
});

describe('studentDetail — edge cases derived from recorded Dilnoza', () => {
  test('single sitting (history trimmed to its last recorded sitting)', () => {
    const view = studentDetail({ ...t2ResultDilnoza, history: t2ResultDilnoza.history?.slice(-1) });
    expect(view.series).toEqual([{ n: 1, satAt: '2026-09-10', value: 41 }]);
    expect(view.tiles.span).toBeNull();
    expect(view.tiles.sittings).toEqual({ count: 1, since: '2026-09-10' });
    expect(view.chart.points).toHaveLength(1);
  });

  test('no history (omitted, as on the class roster read)', () => {
    const view = studentDetail({ ...t2ResultDilnoza, history: undefined });
    expect(view.series).toEqual([]);
    expect(view.tiles).toMatchObject({
      baseline: null,
      latest: { value: 41, satAt: null },
      span: null,
      sittings: { count: 0, since: null },
    });
    expect(view.chart.points).toEqual([]);
    expect(view.subskills.every((entry) => entry.trajectory.length === 0)).toBe(true);
  });
});
