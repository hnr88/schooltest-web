import { describe, expect, test } from 'vitest';

import type { ResultHistoryPoint, ResultView } from '@schooltest/scoring-contracts';

import { buildStudentDrillDownView } from '@/modules/teacher/lib/student-drill-down-view';
import { t2ResultAmara, t2ResultDilnoza } from '@/modules/teacher/lib/v2/__fixtures__/t2';
import type { MomentumKind } from '@/modules/teacher/types/student-report.types';

const EMPTY_ATTRIBUTES: ResultHistoryPoint['attributes'] = {
  Decoding: null,
  Vocab_A2: null,
  Grammar: null,
  Vocab_B1: null,
  Gist: null,
  Detail: null,
  Inference: null,
  Vocab_B2: null,
  Critical: null,
};

function withHistory(base: ResultView, overalls: readonly (number | null)[]): ResultView {
  return {
    ...base,
    history: overalls.map((overall, index): ResultHistoryPoint => ({
      sat_at: `2026-01-${String(index + 1).padStart(2, '0')}`,
      overall,
      attributes: EMPTY_ATTRIBUTES,
    })),
  };
}

describe('buildStudentDrillDownView — growth and momentum (Spec 02 §0.1)', () => {
  test('growth is latest minus first scored overall, signed', () => {
    const up = buildStudentDrillDownView(withHistory(t2ResultAmara, [40, 55]));
    expect(up.growth).toEqual({ delta: 15, direction: 'up' });
    expect(up.momentum).toEqual({ kind: 'accelerating', delta: 15 });

    const down = buildStudentDrillDownView(withHistory(t2ResultAmara, [80, 60]));
    expect(down.growth).toEqual({ delta: -20, direction: 'down' });
    expect(down.momentum).toEqual({ kind: 'slipping', delta: -20 });
  });

  test('recorded Amara: 5 scored of 8 sittings, delta 0', () => {
    const view = buildStudentDrillDownView(t2ResultAmara);
    expect(view.growth).toEqual({ delta: 0, direction: 'flat' });
    expect(view.momentum).toEqual({ kind: 'holding', delta: 0 });
  });

  test('recorded Dilnoza: 3 scored of 8 sittings, delta -35', () => {
    const view = buildStudentDrillDownView(t2ResultDilnoza);
    expect(view.growth).toEqual({ delta: -35, direction: 'down' });
    expect(view.momentum).toEqual({ kind: 'slipping', delta: -35 });
  });

  test('fewer than two scored sittings: no growth and no momentum', () => {
    for (const overalls of [[70], [null, 70], [], [null, null]] as const) {
      const view = buildStudentDrillDownView(withHistory(t2ResultAmara, overalls));
      expect(view.growth).toEqual({ delta: null, direction: null });
      expect(view.momentum).toEqual({ kind: null, delta: null });
    }
  });

  test('the 5/10 provisional thresholds map to the four momentum states', () => {
    const cases: ReadonlyArray<{
      overalls: readonly (number | null)[];
      delta: number;
      kind: MomentumKind;
    }> = [
      { overalls: [70, 60], delta: -10, kind: 'slipping' },
      { overalls: [60, 60], delta: 0, kind: 'holding' },
      { overalls: [60, 64], delta: 4, kind: 'holding' },
      { overalls: [60, 65], delta: 5, kind: 'steady' },
      { overalls: [60, 69], delta: 9, kind: 'steady' },
      { overalls: [60, 70], delta: 10, kind: 'accelerating' },
    ];
    for (const entry of cases) {
      const view = buildStudentDrillDownView(withHistory(t2ResultAmara, entry.overalls));
      expect(view.momentum).toEqual({ kind: entry.kind, delta: entry.delta });
    }
  });
});

describe('buildStudentDrillDownView — chart points and tiles (Spec 02 §3b)', () => {
  test('null overalls are skipped, never plotted as 0', () => {
    const view = buildStudentDrillDownView(withHistory(t2ResultAmara, [null, 40, null, 50]));
    expect(view.chartPoints).toEqual([
      { satAt: '2026-01-02', overall: 40 },
      { satAt: '2026-01-04', overall: 50 },
    ]);
    expect(view.tiles).toEqual({
      baseline: { satAt: '2026-01-02', overall: 40 },
      latest: { satAt: '2026-01-04', overall: 50 },
      sittings: 2,
    });
  });

  test('an empty history has no points and no tiles', () => {
    const view = buildStudentDrillDownView(withHistory(t2ResultAmara, []));
    expect(view.chartPoints).toEqual([]);
    expect(view.tiles).toEqual({ baseline: null, latest: null, sittings: 0 });
  });

  test('recorded Amara: overallPct, the five scored points and their tiles', () => {
    const view = buildStudentDrillDownView(t2ResultAmara);
    expect(view.overallPct).toBe(42);
    expect(view.chartPoints).toEqual([
      { satAt: '2026-09-10', overall: 42 },
      { satAt: '2026-09-10', overall: 42 },
      { satAt: '2026-09-10', overall: 40 },
      { satAt: '2026-09-10', overall: 40 },
      { satAt: '2026-09-11', overall: 42 },
    ]);
    expect(view.tiles).toEqual({
      baseline: { satAt: '2026-09-10', overall: 42 },
      latest: { satAt: '2026-09-11', overall: 42 },
      sittings: 5,
    });
  });
});
