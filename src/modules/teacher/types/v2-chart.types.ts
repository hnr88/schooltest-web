import type { AcaraPhaseName } from '@/modules/teacher/types/v2-view-common.types';

export interface ChartFrame {
  W: number;
  H: number;
  padL: number;
  padR: number;
  padT: number;
  padB: number;
  phaseLabelX: number;
}

export interface ChartPoint {
  n: number;
  satAt: string | null;
  value: number;
  cx: number;
  cy: number;
  labelX: number;
  valueX: number;
  valueAnchor: 'start' | 'middle';
  isLast: boolean;
  valueFill: string;
}

export interface AcaraLabel {
  phase: AcaraPhaseName;
  labelKey: string;
  y: number;
}

export interface AcaraBand extends AcaraLabel {
  h: number;
  midY: number;
  fill: string;
}

export interface LineChartGeometry {
  W: number;
  H: number;
  polyline: string;
  areaPath: string;
  points: ChartPoint[];
  acara: AcaraLabel[];
  phaseLabelX: number;
  axisX: number;
  axisY: number;
  axisRight: number;
  xLabelY: number;
  xSubY: number;
}

export interface ClassChartGeometry extends LineChartGeometry {
  axisTop: number;
  bandW: number;
  bands: AcaraBand[];
  legend: AcaraBand[];
}

export interface StudentChartGeometry extends LineChartGeometry {
  bounds: Array<{ y: number }>;
}

export interface SparklinePoint {
  cx: number;
  cy: number;
}

export interface SparklineGeometry {
  w: number;
  h: number;
  polyline: string;
  last: SparklinePoint | null;
}

/**
 * Spec 02 §3b — the student report chart: the same line geometry, but the ACARA
 * phases are four EQUAL-HEIGHT washes (piecewise y, edges 0/45/62/80/100) with
 * their names centred in each band and no numeric axis. `bands` runs top-first.
 */
export interface StudentBandChartGeometry extends LineChartGeometry {
  axisTop: number;
  bandW: number;
  bands: AcaraBand[];
  /** The interior band edges (45/62/80) as dashed grid lines. */
  bounds: Array<{ y: number }>;
}
