import { describe, expect, test } from 'vitest';

import { progressTabView } from '@/modules/teacher/lib/progress-tab';
import { t2Roster } from '@/modules/teacher/lib/v2/__fixtures__/t2';

const view = progressTabView(t2Roster);

describe('progressTabView — recorded t2 roster', () => {
  test('ready, with the subtitle sitting count the longest SCORED history holds', () => {
    expect(view.status).toBe('ready');
    expect(view.sittings).toBe(5);
  });

  test('dot-map rows are the students with a scored overall, highest latest first', () => {
    expect(view.dotMap.rows.map((row) => [row.firstName, row.latest.score])).toEqual([
      ['Chen', 73],
      ['Bilal', 54],
      ['Rosa', 45],
      ['Amara', 42],
      ['Dilnoza', 41],
      ['Lucia', 40],
      ['Panit', 40],
      ['Eitan', 40],
      ['Kaveh', 40],
      ['Nour', 40],
      ['Farida', 40],
      ['Jae-won', 38],
      ['Oluwaseun', 38],
      ['Mihail', 38],
      ['Qadir', 38],
      ['Gia', 38],
      ['Hamza', 38],
      ['Ines', 38],
      ['Tenzin', 37],
    ]);
  });

  test('band header counts read the latest overall of every row', () => {
    expect(view.dotMap.phases).toEqual([
      { phase: 'Beginning', count: 16 },
      { phase: 'Emerging', count: 2 },
      { phase: 'Developing', count: 1 },
      { phase: 'Consolidating', count: 0 },
    ]);
  });

  test('the summary line and the class-analysis counts are the same reliable-mover tally', () => {
    expect(view.dotMap.summary).toEqual({ up: 1, held: 17, down: 1 });
    expect(view.analysis).toEqual(view.dotMap.summary);
  });

  test('the two gains lists are the server-delta rankings', () => {
    expect(view.gainTop.map((mover) => mover.firstName)).toEqual(['Rosa', 'Amara']);
    // Never the same student in both cards (celebrated and flagged at once, as needsSupport).
    expect(view.gainLow.map((mover) => mover.firstName)).toEqual(['Dilnoza']);
  });
});

describe('progressTabView — the §3d subskill-growth maps', () => {
  test('the recorded roster predates attribute_bands: §3d stays hidden (BUG-009 gate) instead of claiming everyone held', () => {
    expect(view.subMap).toEqual([]);
  });
});

describe('progressTabView — edge cases derived from the recorded roster', () => {
  test('empty roster (no rows at all): nothing is invented', () => {
    const empty = progressTabView([]);
    expect(empty.status).toBe('empty');
    expect(empty.sittings).toBe(0);
    expect(empty.dotMap.rows).toEqual([]);
    expect(empty.dotMap.phases.map((phase) => phase.count)).toEqual([0, 0, 0, 0]);
    expect(empty.dotMap.summary).toEqual({ up: 0, held: 0, down: 0 });
    expect(empty.gainTop).toEqual([]);
    expect(empty.gainLow).toEqual([]);
    expect(empty.subMap).toEqual([]);
  });

  test('every recorded row with its result removed: still empty', () => {
    const unscored = progressTabView(t2Roster.map((row) => ({ ...row, result: null })));
    expect(unscored.status).toBe('empty');
    expect(unscored.dotMap.rows).toEqual([]);
  });

  test('single sitting (the recorded students whose history holds one sitting): dots only, nobody moved', () => {
    const single = progressTabView(t2Roster.filter((row) => row.result?.history?.length === 1));
    expect(single.sittings).toBe(1);
    expect(single.dotMap.rows).toHaveLength(6);
    expect(single.dotMap.rows.every((row) => row.movement === 'held' && row.sittings === 1)).toBe(true);
    expect(single.dotMap.summary).toEqual({ up: 0, held: 6, down: 0 });
    expect(single.gainTop).toEqual([]);
    expect(single.gainLow).toEqual([]);
  });
});
