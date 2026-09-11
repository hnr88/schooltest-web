import type { ChartFrame } from '@/modules/teacher/types/v2-chart.types';
import type { AcaraPhaseName } from '@/modules/teacher/types/v2-view-common.types';

export const CLASS_CHART_FRAME: ChartFrame = { W: 720, H: 200, padL: 118, padR: 24, padT: 20, padB: 38 };

export const STUDENT_CHART_FRAME: ChartFrame = { W: 640, H: 250, padL: 132, padR: 18, padT: 16, padB: 44 };

export const CHART_SCALE_MAX = 100;

export const CHART_X_LABEL_OFFSET = 18;

export const CLASS_CHART_X_SUB_OFFSET = 31;

export const STUDENT_CHART_X_SUB_OFFSET = 32;

export const ACARA_LABEL_LEVELS: ReadonlyArray<{ phase: AcaraPhaseName; value: number }> = [
  { phase: 'Consolidating', value: 90 },
  { phase: 'Developing', value: 70 },
  { phase: 'Emerging', value: 50 },
  { phase: 'Beginning', value: 20 },
];

export const ACARA_BAND_RANGES: ReadonlyArray<{ phase: AcaraPhaseName; top: number; bottom: number; fill: string }> = [
  { phase: 'Consolidating', top: 100, bottom: 80, fill: '#E9F6EF' },
  { phase: 'Developing', top: 80, bottom: 62, fill: '#EAF0FB' },
  { phase: 'Emerging', top: 62, bottom: 45, fill: '#FDF4E3' },
  { phase: 'Beginning', top: 45, bottom: 0, fill: '#FBEEEC' },
];

export const STUDENT_CHART_GRID_LEVELS: readonly number[] = [40, 60, 80];

export const CHART_LAST_POINT_FILL = '#0E2350';

export const CHART_POINT_FILL = '#8A94A6';

export const SPARKLINE_FRAME = { w: 132, h: 40, pad: 6, lo: 20, hi: 98 } as const;
