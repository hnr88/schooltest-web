import { describe, expect, test } from 'vitest';

import type { ResultView } from '@schooltest/scoring-contracts';

import { t2Result, t2ResultDilnoza } from '@/modules/teacher/lib/v2/__fixtures__/t2';
import { acaraChart, sparkline, studentChart } from '@/modules/teacher/lib/v2/chart-geometry';
import type { SeriesPoint } from '@/modules/teacher/types/v2-view-common.types';

function recordedOverall(result: ResultView): SeriesPoint[] {
  return (result.history ?? []).flatMap((point, index) =>
    point.overall === null ? [] : [{ n: index + 1, satAt: point.sat_at, value: point.overall }],
  );
}

function recordedSkill(result: ResultView, skill: 'Decoding' | 'Critical'): number[] {
  return (result.history ?? []).flatMap((point) => {
    const value = point.attributes[skill];
    return value === null ? [] : [value];
  });
}

describe('acaraChart — the design class chart geometry on recorded series', () => {
  test('points carry the recorded sitting ordinal, date and value', () => {
    expect(acaraChart(recordedOverall(t2ResultDilnoza)).points.map(({ n, satAt, value, isLast }) => ({ n, satAt, value, isLast }))).toEqual([
      { n: 6, satAt: '2026-09-10', value: 76, isLast: false },
      { n: 7, satAt: '2026-09-10', value: 84, isLast: false },
      { n: 8, satAt: '2026-09-10', value: 41, isLast: true },
    ]);
  });

  test('single recorded sitting (Jae-won) centres one point where the design would divide by zero', () => {
    const chart = acaraChart(recordedOverall(t2Result('Jae-won')));
    expect(chart.points).toHaveLength(1);
    expect(chart.points[0]).toMatchObject({ cx: 407, cy: 108, labelX: 407, isLast: true, valueFill: '#0E2350' });
    expect(chart.polyline).toBe('407,108');
    expect(chart.areaPath).toBe('M407,162 L407,108 L407,162 Z');
  });

  test('recorded Sunniva (both sittings unscored) draws an empty frame with the bands still in place', () => {
    const chart = acaraChart(recordedOverall(t2Result('Sunniva')));
    expect(chart.points).toEqual([]);
    expect(chart.polyline).toBe('');
    expect(chart.areaPath).toBe('');
    expect(chart.bands).toHaveLength(4);
  });
});

describe('studentChart — the design student chart geometry on recorded series', () => {
  test('single recorded sitting (Jae-won) centres one point', () => {
    const chart = studentChart(recordedOverall(t2Result('Jae-won')));
    expect(chart.points[0]).toMatchObject({ cx: 377, cy: 134 });
    expect(chart.areaPath).toBe('M377,206 L377,134 L377,206 Z');
  });
});

describe('sparkline — the design sparkline on recorded trajectories', () => {
  test('one recorded value (Dilnoza Critical) is a centred dot', () => {
    expect(sparkline(recordedSkill(t2ResultDilnoza, 'Critical'))).toEqual({ w: 132, h: 40, polyline: '66,10', last: { cx: 66, cy: 10 } });
  });

  test('no values is an empty line with no end dot', () => {
    expect(sparkline([])).toEqual({ w: 132, h: 40, polyline: '', last: null });
  });
});
