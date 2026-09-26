import {
  ACARA_BAND_RANGES,
  ACARA_LABEL_LEVELS,
  CHART_FIRST_VALUE_INSET,
  CHART_LAST_POINT_FILL,
  CHART_POINT_FILL,
  CHART_SCALE_MAX,
  CHART_X_LABEL_OFFSET,
  CLASS_CHART_FRAME,
  CLASS_CHART_X_SUB_OFFSET,
  SPARKLINE_FRAME,
  STUDENT_BAND_CHART_BANDS,
  STUDENT_BAND_EDGES,
  STUDENT_CHART_FRAME,
  STUDENT_CHART_GRID_LEVELS,
  STUDENT_CHART_X_SUB_OFFSET,
} from '@/modules/teacher/constants/v2-chart.constants';
import { PHASE_LABEL_KEY } from '@/modules/teacher/constants/v2-i18n.constants';
import type {
  ChartFrame,
  ChartPoint,
  ClassChartGeometry,
  LineChartGeometry,
  SparklineGeometry,
  StudentBandChartGeometry,
  StudentChartGeometry,
} from '@/modules/teacher/types/v2-chart.types';
import type { SeriesPoint } from '@/modules/teacher/types/v2-view-common.types';

function fraction(index: number, count: number): number {
  return count === 1 ? 0.5 : index / (count - 1);
}

function yScale(frame: ChartFrame): (value: number) => number {
  const plotHeight = frame.H - frame.padT - frame.padB;
  return (value) => Math.round(frame.padT + (1 - value / CHART_SCALE_MAX) * plotHeight);
}

/**
 * Spec 02 §3b — the piecewise y of the student report chart: each ACARA band
 * between `STUDENT_BAND_EDGES` is a quarter of the plot, so a score maps
 * proportionally WITHIN its band instead of linearly across the whole plot.
 */
function bandYScale(frame: ChartFrame): (value: number) => number {
  const plotHeight = frame.H - frame.padT - frame.padB;
  const bandH = plotHeight / (STUDENT_BAND_EDGES.length - 1);
  const axisY = frame.H - frame.padB;
  const top = STUDENT_BAND_EDGES[STUDENT_BAND_EDGES.length - 1];
  return (value) => {
    const clamped = Math.min(Math.max(value, STUDENT_BAND_EDGES[0]), top);
    for (let band = 0; band < STUDENT_BAND_EDGES.length - 1; band += 1) {
      const lo = STUDENT_BAND_EDGES[band];
      const hi = STUDENT_BAND_EDGES[band + 1];
      if (clamped <= hi) {
        const within = (clamped - lo) / (hi - lo);
        return Math.round(axisY - band * bandH - within * bandH);
      }
    }
    return axisY;
  };
}

function lineChart(
  points: readonly SeriesPoint[],
  frame: ChartFrame,
  subOffset: number,
  yOfOverride?: (value: number) => number,
): LineChartGeometry {
  const yOf = yOfOverride ?? yScale(frame);
  const plotWidth = frame.W - frame.padL - frame.padR;
  const axisY = frame.H - frame.padB;
  const plotted = points.map((point, index): ChartPoint => {
    const cx = Math.round(frame.padL + fraction(index, points.length) * plotWidth);
    const isLast = index === points.length - 1;
    const onAxis = index === 0 && points.length > 1;
    return {
      n: point.n,
      satAt: point.satAt,
      value: point.value,
      cx,
      cy: yOf(point.value),
      labelX: cx,
      valueX: onAxis ? cx + CHART_FIRST_VALUE_INSET : cx,
      valueAnchor: onAxis ? 'start' : 'middle',
      isLast,
      valueFill: isLast ? CHART_LAST_POINT_FILL : CHART_POINT_FILL,
    };
  });
  const coords = plotted.map((point) => `${point.cx},${point.cy}`);
  const first = plotted.at(0);
  const last = plotted.at(-1);
  return {
    W: frame.W,
    H: frame.H,
    polyline: coords.join(' '),
    areaPath:
      first === undefined || last === undefined ? '' : `M${first.cx},${axisY} L${coords.join(' L')} L${last.cx},${axisY} Z`,
    points: plotted,
    acara: ACARA_LABEL_LEVELS.map((level) => ({
      phase: level.phase,
      labelKey: PHASE_LABEL_KEY[level.phase],
      y: yOf(level.value),
    })),
    phaseLabelX: frame.phaseLabelX,
    axisX: frame.padL,
    axisY,
    axisRight: frame.W - frame.padR,
    xLabelY: axisY + CHART_X_LABEL_OFFSET,
    xSubY: axisY + subOffset,
  };
}

export function acaraChart(points: readonly SeriesPoint[]): ClassChartGeometry {
  const frame = CLASS_CHART_FRAME;
  const yOf = yScale(frame);
  const bands = ACARA_BAND_RANGES.map((range) => {
    const top = yOf(range.top);
    const bottom = yOf(range.bottom);
    return {
      phase: range.phase,
      labelKey: PHASE_LABEL_KEY[range.phase],
      y: Math.min(top, bottom),
      h: Math.abs(bottom - top),
      midY: (top + bottom) / 2,
      fill: range.fill,
    };
  });
  return {
    ...lineChart(points, frame, CLASS_CHART_X_SUB_OFFSET),
    axisTop: frame.padT,
    bandW: frame.W - frame.padL - frame.padR,
    bands,
    legend: [...bands].reverse(),
  };
}

export function studentChart(points: readonly SeriesPoint[]): StudentChartGeometry {
  const yOf = yScale(STUDENT_CHART_FRAME);
  return {
    ...lineChart(points, STUDENT_CHART_FRAME, STUDENT_CHART_X_SUB_OFFSET),
    bounds: STUDENT_CHART_GRID_LEVELS.map((level) => ({ y: yOf(level) })),
  };
}

/**
 * Spec 02 §3b — the student report chart over the SAME frame as `studentChart`,
 * but the four ACARA phases are equal-height washes (`STUDENT_BAND_CHART_BANDS`)
 * on the piecewise `bandYScale`, their names centred in each band, and the three
 * interior edges drawn as dashed bounds. No numeric axis is drawn anywhere.
 */
export function studentBandChart(points: readonly SeriesPoint[]): StudentBandChartGeometry {
  const frame = STUDENT_CHART_FRAME;
  const yOf = bandYScale(frame);
  const bands = STUDENT_BAND_CHART_BANDS.map((band) => {
    const top = yOf(band.top);
    const bottom = yOf(band.bottom);
    return {
      phase: band.phase,
      labelKey: PHASE_LABEL_KEY[band.phase],
      y: Math.min(top, bottom),
      h: Math.abs(bottom - top),
      midY: (top + bottom) / 2,
      fill: band.fill,
    };
  });
  return {
    ...lineChart(points, frame, STUDENT_CHART_X_SUB_OFFSET, yOf),
    // Band names sit centred in their own band, not at the linear label levels.
    acara: bands.map(({ phase, labelKey, midY }) => ({ phase, labelKey, y: midY })),
    axisTop: frame.padT,
    bandW: frame.W - frame.padL - frame.padR,
    bands,
    bounds: STUDENT_BAND_EDGES.slice(1, -1).map((edge) => ({ y: yOf(edge) })),
  };
}

export function sparkline(values: readonly number[]): SparklineGeometry {
  const { w, h, pad, lo, hi } = SPARKLINE_FRAME;
  const yOf = (value: number) => pad + (1 - (Math.max(lo, Math.min(hi, value)) - lo) / (hi - lo)) * (h - 2 * pad);
  const points = values.map((value, index) => ({
    cx: Math.round(pad + fraction(index, values.length) * (w - 2 * pad)),
    cy: Math.round(yOf(value)),
  }));
  return { w, h, polyline: points.map((point) => `${point.cx},${point.cy}`).join(' '), last: points.at(-1) ?? null };
}
