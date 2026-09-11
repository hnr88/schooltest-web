import { describe, expect, test } from 'vitest';

import type { ResultView } from '@schooltest/scoring-contracts';

import {
  designAcaraChart,
  designSparkline,
  designStudentChart,
} from '@/modules/teacher/lib/v2/__fixtures__/design-chart-oracle';
import { t2Result, t2ResultAmara, t2ResultDilnoza, t2Roster } from '@/modules/teacher/lib/v2/__fixtures__/t2';
import { acaraChart, sparkline, studentChart } from '@/modules/teacher/lib/v2/chart-geometry';
import { classProgress } from '@/modules/teacher/lib/v2/class-progress';
import type { LineChartGeometry } from '@/modules/teacher/types/v2-chart.types';
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

// Label boxes at the charts' own type (`Teacher Portal v2.dc.html:409–423`, `:904–916`): a glyph 0.62em wide ('%'
// 0.9em), 0.75em above its baseline and 0.25em below; a value sits 13px above its point, a phase name 4px below its level.
type Box = { left: number; right: number; top: number; bottom: number };

function box(text: string, x: number, baseline: number, size: number, anchor: 'start' | 'middle' | 'end'): Box {
  const width = [...text].reduce((sum, glyph) => sum + (glyph === '%' ? 0.9 : 0.62), 0) * size;
  const left = anchor === 'end' ? x - width : anchor === 'middle' ? x - width / 2 : x;
  return { left, right: left + width, top: baseline - 0.75 * size, bottom: baseline + 0.25 * size };
}

const overlaps = (a: Box, b: Box) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
const month = (iso: string | null) =>
  iso === null ? '' : new Intl.DateTimeFormat('en', { month: 'short', timeZone: 'UTC' }).format(new Date(iso));

function firstPointBoxes(chart: LineChartGeometry, sittingSize: number): { design: Box; drawn: Box[] } {
  const first = chart.points[0];
  return {
    design: box(`${first.value}%`, first.cx, first.cy - 13, 13, 'middle'),
    drawn: [
      box(`${first.value}%`, first.valueX, first.cy - 13, 13, first.valueAnchor),
      box(`Sitting ${first.n}`, first.labelX, chart.xLabelY, sittingSize, 'middle'),
      box(month(first.satAt), first.labelX, chart.xSubY, 10.5, 'middle'),
    ],
  };
}

const phaseColumn = (chart: LineChartGeometry, levels: ReadonlyArray<{ phase: string; y: number }>, size: number) =>
  levels.map((level) => box(level.phase, chart.phaseLabelX, level.y + 4, size, 'end'));
const clashes = (labels: Box[], column: Box[]) => labels.flatMap((label) => column.filter((name) => overlaps(label, name)));

describe('first-point labels clear the phase-name column on the recorded series', () => {
  const classChart = classProgress(t2Roster).chart;
  const studentCharts = [t2ResultDilnoza, t2ResultAmara, ...t2Roster.flatMap((row) => (row.result ? [row.result] : []))]
    .map((result) => studentChart(recordedOverall(result)))
    .filter((chart) => chart.points.length > 1);

  test('recorded t2 class: the design’s centred 44% prints into the band names; the drawn labels clear them', () => {
    const column = phaseColumn(classChart, classChart.bands.map((band) => ({ phase: band.phase, y: band.midY })), 11);
    const { design, drawn } = firstPointBoxes(classChart, 11.5);
    expect(classChart.points[0].value).toBe(44);
    expect(column.some((name) => overlaps(design, name))).toBe(true);
    expect(clashes(drawn, column)).toEqual([]);
  });

  test('every recorded student series: the drawn first-point labels clear the phase names (Dilnoza’s 76% did not)', () => {
    expect(studentCharts.length).toBeGreaterThan(2);
    const [dilnoza] = studentCharts;
    expect(phaseColumn(dilnoza, dilnoza.acara, 11.5).some((name) => overlaps(firstPointBoxes(dilnoza, 12).design, name))).toBe(true);
    for (const chart of studentCharts) {
      expect(clashes(firstPointBoxes(chart, 12).drawn, phaseColumn(chart, chart.acara, 11.5))).toEqual([]);
    }
  });

  test('every other value label keeps the design’s centred place, as does a lone sitting', () => {
    for (const chart of [classChart, ...studentCharts]) {
      expect(chart.points.slice(1).every((point) => point.valueX === point.cx && point.valueAnchor === 'middle')).toBe(true);
    }
    expect(acaraChart(recordedOverall(t2Result('Jae-won'))).points[0]).toMatchObject({ valueX: 407, valueAnchor: 'middle' });
    expect([classChart.phaseLabelX, studentCharts[0].phaseLabelX]).toEqual([114, 124]);
  });
});
