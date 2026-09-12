import { GROWTH_FG } from '@/modules/teacher/constants/v2-tones.constants';
import { describe, expect, test } from 'vitest';

import type { DisplaySkill } from '@schooltest/scoring-contracts';

import { t2Roster, t2Row } from '@/modules/teacher/lib/v2/__fixtures__/t2';
import { classProgress } from '@/modules/teacher/lib/v2/class-progress';
import type { SubskillTrend } from '@/modules/teacher/types/v2-class-tabs.types';

const view = classProgress(t2Roster);

function trend(skill: DisplaySkill): SubskillTrend {
  const found = view.subskillTrends.find((entry) => entry.skill === skill);
  if (found === undefined) throw new Error(`no ${skill} trend`);
  return found;
}

describe('classProgress — recorded t2 roster', () => {
  test('tiles read the server deltas of the 4 students who have one, with the design ±3 cut', () => {
    expect(view.paired).toBe(4);
    expect(view.tiles).toEqual([
      { id: 'meanShift', value: -9, fg: '#B42318' },
      { id: 'gained', value: 1, fg: '#1F7A4D' },
      { id: 'held', value: 2, fg: '#0E2350' },
      { id: 'slipped', value: 1, fg: '#B42318' },
    ]);
  });

  test('class average by sitting aligns every recorded history on its latest sitting', () => {
    expect(view.series.map((point) => point.value)).toEqual([44, 40, 39, 40, 42, 47, 52, 41]);
    expect(view.series.map((point) => point.contributors)).toEqual([1, 1, 3, 3, 2, 5, 6, 14]);
    expect(view.series.map((point) => point.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(view.series.map((point) => point.satAt)).toEqual([
      '2026-09-10',
      '2026-09-10',
      '2026-09-10',
      '2026-09-10',
      '2026-09-10',
      '2026-09-10',
      '2026-09-10',
      '2026-09-11',
    ]);
  });

  test('the summary sentence data spans the first and last plotted sittings', () => {
    expect(view.summary).toEqual({ from: 44, to: 41, difference: -3, sittings: 8 });
  });

  test('the chart is drawn from the same series', () => {
    expect(view.chart.points.map((point) => point.value)).toEqual([44, 40, 39, 40, 42, 47, 52, 41]);
  });

  test('top progress is the reliable gains, in order', () => {
    expect(view.topProgress).toEqual([
      {
        studentDocumentId: t2Row('Rosa').student.document_id,
        name: 'Rosa Baptiste',
        firstName: 'Rosa',
        score: 45,
        growth: { kind: 'up', delta: 5, points: 5, reliable: true, fg: '#1F7A4D' },
      },
      {
        studentDocumentId: t2Row('Amara').student.document_id,
        name: 'Amara Baptiste',
        firstName: 'Amara',
        score: 42,
        growth: { kind: 'steady', delta: 2, points: null, reliable: true, fg: GROWTH_FG.steady },
      },
    ]);
  });

  test('students to watch: a reliable decline first, then the lowest scores', () => {
    expect(view.watch.map((mover) => [mover.firstName, mover.score])).toEqual([
      ['Dilnoza', 41],
      ['Tenzin', 37],
      ['Jae-won', 38],
    ]);
  });

  test('subskill trends: the class mean per skill by sitting, weakest now first', () => {
    expect(view.subskillTrends.map((entry) => [entry.skill, entry.now])).toEqual([
      ['Decoding', 25],
      ['Vocabulary', 25],
      ['Grammar', 25],
      ['Detail', 25],
      ['Gist', 28],
      ['Inference', 36],
      ['Critical', 50],
    ]);
    expect(trend('Critical')).toMatchObject({
      labelKey: 'skill.critical',
      values: [46, 45, 47, 55, 50],
      difference: 4,
      differenceFg: '#1F7A4D',
      stroke: '#92610B',
    });
    expect(trend('Decoding')).toMatchObject({
      values: [26, 25, 25, 25, 25, 42, 52, 25],
      difference: -1,
      differenceFg: '#B42318',
      stroke: '#B42318',
    });
    expect(trend('Gist')).toMatchObject({ values: [28, 29, 29, 39, 40, 28], difference: 0, differenceFg: '#5B6472' });
    expect(trend('Critical').spark.polyline.split(' ')).toHaveLength(5);
  });
});

describe('classProgress — edge cases derived from the recorded roster', () => {
  test('empty roster (every recorded row removed): nothing is invented', () => {
    const empty = classProgress(t2Roster.slice(0, 0));
    expect(empty.tiles.map((tile) => tile.value)).toEqual([null, 0, 0, 0]);
    expect(empty.tiles[0].fg).toBe(GROWTH_FG.none);
    expect(empty).toMatchObject({ paired: 0, series: [], summary: null, topProgress: [], watch: [] });
    expect(empty.chart.points).toEqual([]);
    expect(empty.subskillTrends.every((entry) => entry.now === null && entry.values.length === 0 && entry.difference === null)).toBe(true);
  });

  test('single sitting (only the recorded students whose history holds one sitting): a point, no summary', () => {
    const single = classProgress(t2Roster.filter((row) => row.result?.history?.length === 1));
    expect(single.series).toEqual([{ n: 1, satAt: '2026-09-10', value: 38, contributors: 6 }]);
    expect(single.summary).toBeNull();
    expect(single.paired).toBe(0);
    expect(single.chart.points).toHaveLength(1);
  });
});
