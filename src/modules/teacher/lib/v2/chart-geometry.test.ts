import { describe, expect, test } from 'vitest';

import type { ResultView } from '@schooltest/scoring-contracts';

import {
  designAcaraChart,
  designSparkline,
  designStudentChart,
} from '@/modules/teacher/lib/v2/__fixtures__/design-chart-oracle';
import { t2Result, t2ResultAmara, t2ResultDilnoza } from '@/modules/teacher/lib/v2/__fixtures__/t2';
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

const RECORDED_SERIES: Array<[string, SeriesPoint[]]> = [
  ['Dilnoza', recordedOverall(t2ResultDilnoza)],
  ['Amara', recordedOverall(t2ResultAmara)],
];

describe('acaraChart — the design class chart geometry on recorded series', () => {
  for (const [name, series] of RECORDED_SERIES) {
    test(`recorded ${name} overall series matches the design acaraChart field for field`, () => {
      const design = designAcaraChart(series.map((point) => point.value));
      const chart = acaraChart(series);
      expect(chart.polyline).toBe(design.polyline);
      expect(chart.areaPath).toBe(design.areaPath);
      expect(chart.points.map(({ cx, cy, labelX, valueFill }) => ({ cx, cy, labelX, lastFg: valueFill }))).toEqual(design.points);
      expect(chart.acara.map(({ phase, y }) => ({ label: phase, y }))).toEqual(design.acara);
      expect(chart.bands.map(({ phase, y, h, fill, midY }) => ({ label: phase, y, h, fill, midY }))).toEqual(design.bands);
      expect(chart.legend.map((band) => band.phase)).toEqual(design.legend.map((band) => band.label));
      const { W, H, bandW, axisX, axisY, axisTop, axisRight, xLabelY, xSubY } = chart;
      expect({ W, H, bandW, axisX, axisY, axisTop, axisRight, xLabelY, xSubY }).toEqual({
        W: design.W,
        H: design.H,
        bandW: design.bandW,
        axisX: design.axisX,
        axisY: design.axisY,
        axisTop: design.axisTop,
        axisRight: design.axisRight,
        xLabelY: design.xLabelY,
        xSubY: design.xSubY,
      });
    });
  }

  test('points carry the recorded sitting ordinal, date and value', () => {
    expect(acaraChart(recordedOverall(t2ResultDilnoza)).points.map(({ n, satAt, value, isLast }) => ({ n, satAt, value, isLast }))).toEqual([
      { n: 6, satAt: '2026-09-10', value: 76, isLast: false },
      { n: 7, satAt: '2026-09-10', value: 84, isLast: false },
      { n: 8, satAt: '2026-09-10', value: 41, isLast: true },
    ]);
  });

  test('bands and ACARA labels carry phase label keys', () => {
    const chart = acaraChart([]);
    expect(chart.bands.map((band) => band.labelKey)).toEqual(['phase.consolidating', 'phase.developing', 'phase.emerging', 'phase.beginning']);
    expect(chart.acara.map((label) => label.labelKey)).toEqual(['phase.consolidating', 'phase.developing', 'phase.emerging', 'phase.beginning']);
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
  for (const [name, series] of RECORDED_SERIES) {
    test(`recorded ${name} overall series matches the design chart field for field`, () => {
      const design = designStudentChart(series.map((point) => point.value));
      const chart = studentChart(series);
      expect(chart.polyline).toBe(design.polyline);
      expect(chart.areaPath).toBe(design.areaPath);
      expect(chart.points.map(({ cx, cy, labelX, valueFill }) => ({ cx, cy, labelX, lastFg: valueFill }))).toEqual(design.points);
      expect(chart.acara.map(({ phase, y }) => ({ label: phase, y }))).toEqual(design.acara);
      expect(chart.bounds).toEqual(design.bounds);
      const { axisX, axisY, axisRight, xLabelY, xSubY } = chart;
      expect({ axisX, axisY, axisRight, xLabelY, xSubY }).toEqual({
        axisX: design.axisX,
        axisY: design.axisY,
        axisRight: design.axisRight,
        xLabelY: design.xLabelY,
        xSubY: design.xSubY,
      });
      expect([chart.W, chart.H]).toEqual([640, 250]);
    });
  }

  test('single recorded sitting (Jae-won) centres one point', () => {
    const chart = studentChart(recordedOverall(t2Result('Jae-won')));
    expect(chart.points[0]).toMatchObject({ cx: 377, cy: 134 });
    expect(chart.areaPath).toBe('M377,206 L377,134 L377,206 Z');
  });
});

describe('sparkline — the design sparkline on recorded trajectories', () => {
  const cases: Array<[string, number[]]> = [
    ['Dilnoza Decoding', recordedSkill(t2ResultDilnoza, 'Decoding')],
    ['Amara Critical', recordedSkill(t2ResultAmara, 'Critical')],
  ];
  for (const [name, values] of cases) {
    test(`recorded ${name} trajectory matches the design sparkline`, () => {
      expect(sparkline(values)).toEqual(designSparkline(values));
    });
  }

  test('one recorded value (Dilnoza Critical) is a centred dot', () => {
    expect(sparkline(recordedSkill(t2ResultDilnoza, 'Critical'))).toEqual({ w: 132, h: 40, polyline: '66,10', last: { cx: 66, cy: 10 } });
  });

  test('no values is an empty line with no end dot', () => {
    expect(sparkline([])).toEqual({ w: 132, h: 40, polyline: '', last: null });
  });
});
