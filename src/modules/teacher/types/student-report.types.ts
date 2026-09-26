import type { AssessedBand, DisplaySkill } from '@schooltest/scoring-contracts';

import type { ProgressDirection } from '@/modules/teacher/types/student-drill-down.types';

export interface DrillDownChartPoint {
  satAt: string;
  overall: number;
}

export interface DrillDownGrowth {
  delta: number | null;
  direction: ProgressDirection | null;
}

export type MomentumKind = 'slipping' | 'holding' | 'steady' | 'accelerating';

export interface DrillDownMomentum {
  kind: MomentumKind | null;
  delta: number | null;
}

export interface DrillDownProgressTiles {
  baseline: DrillDownChartPoint | null;
  latest: DrillDownChartPoint | null;
  sittings: number;
}

export type DrillDownBreakdownRow =
  | { kind: 'band'; attribute: DisplaySkill; band: AssessedBand | null; provisionalCut: boolean }
  | { kind: 'gate'; attribute: 'Critical'; passed: boolean | null };
