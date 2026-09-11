import { describe, expect, test } from 'vitest';

import { progressTabView, signedStep } from '@/modules/teacher/lib/progress-tab';
import { t2Roster } from '@/modules/teacher/lib/v2/__fixtures__/t2';

describe('signedStep — the design’s Mean shift and summary spelling', () => {
  test('zero and gains carry a plus, a fall carries a true minus', () => {
    expect([signedStep(0), signedStep(12), signedStep(-3)]).toEqual(['+0', '+12', '−3']);
  });
});

describe('progressTabView — recorded t2 roster', () => {
  const view = progressTabView(t2Roster);

  test('the tiles print the server deltas of the 4 paired students in the kit tones', () => {
    expect(view.tiles).toEqual([
      { id: 'meanShift', tone: 'danger', text: '−9', points: true },
      { id: 'gained', tone: 'success', text: '1', points: false },
      { id: 'held', tone: 'navy', text: '2', points: false },
      { id: 'slipped', tone: 'danger', text: '1', points: false },
    ]);
  });

  test('the chart and the sentence under it cover the 8 recorded sittings', () => {
    expect(view.status).toBe('ready');
    expect(view.sittings).toBe(8);
    expect(view.chart.points.map((point) => point.value)).toEqual([44, 40, 39, 40, 42, 47, 52, 41]);
    expect(view.summary).toEqual({
      key: 'chart.summary',
      values: { from: 44, to: 41, count: 8, difference: '−3' },
    });
  });

  test('every subskill with a recorded class mean gets a trend, weakest now first', () => {
    expect(view.trends.map((trend) => [trend.skill, trend.now])).toEqual([
      ['Decoding', 25],
      ['Vocabulary', 25],
      ['Grammar', 25],
      ['Detail', 25],
      ['Gist', 28],
      ['Inference', 36],
      ['Critical', 50],
    ]);
  });

  test('the two lists are the view model’s movers, in order', () => {
    expect(view.topProgress.map((mover) => mover.firstName)).toEqual(['Rosa', 'Amara']);
    expect(view.watch.map((mover) => mover.firstName)).toEqual(['Dilnoza', 'Tenzin', 'Jae-won']);
  });
});

describe('progressTabView — edge cases derived from the recorded roster', () => {
  test('empty roster (every recorded row removed): the dash on every tile, no sitting, no trend', () => {
    const empty = progressTabView(t2Roster.slice(0, 0));
    expect(empty.status).toBe('empty');
    expect(empty.sittings).toBe(0);
    expect(empty.tiles.map((tile) => [tile.id, tile.text, tile.tone])).toEqual([
      ['meanShift', null, 'navy'],
      ['gained', null, 'navy'],
      ['held', null, 'navy'],
      ['slipped', null, 'navy'],
    ]);
    expect(empty.summary).toEqual({ key: 'chart.summaryEmpty', values: {} });
    expect(empty.chart.points).toEqual([]);
    expect(empty.trends).toEqual([]);
  });

  test('every recorded row with its result removed: nothing to show, status empty', () => {
    const unscored = progressTabView(t2Roster.map((row) => ({ ...row, result: null })));
    expect(unscored.status).toBe('empty');
    expect(unscored.tiles.every((tile) => tile.text === null)).toBe(true);
  });

  test('single sitting (the recorded students with one sitting): one point, the one-sitting sentence, no comparison', () => {
    const single = progressTabView(t2Roster.filter((row) => row.result?.history?.length === 1));
    expect(single.sittings).toBe(1);
    expect(single.chart.points).toHaveLength(1);
    expect(single.summary).toEqual({ key: 'chart.summarySingle', values: { value: 38 } });
    expect(single.tiles.every((tile) => tile.text === null)).toBe(true);
  });
});
