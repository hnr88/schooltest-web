import type { AcaraPhaseName } from '@/modules/teacher/types/v2-view-common.types';

export interface ChartFrame {
  W: number;
  H: number;
  padL: number;
  padR: number;
  padT: number;
  padB: number;
}

export interface ChartPoint {
  n: number;
  satAt: string | null;
  value: number;
  cx: number;
  cy: number;
  labelX: number;
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
