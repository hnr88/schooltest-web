import type { AssessedBand } from '@schooltest/scoring-contracts';

import type { SparklineGeometry, StudentChartGeometry } from '@/modules/teacher/types/v2-chart.types';
import type {
  BandView,
  GrowthView,
  PhaseView,
  ScoreSpan,
  ScoredSkill,
  SeriesPoint,
  SkillRef,
  ViewTone,
} from '@/modules/teacher/types/v2-view-common.types';

export type SubskillDelta =
  | { kind: 'points'; points: number; fg: string }
  | { kind: 'steady'; fg: string }
  | { kind: 'bands'; before: AssessedBand; after: AssessedBand; fg: string }
  | { kind: 'none' };

export interface GateView {
  passed: boolean;
  labelKey: string;
  tone: ViewTone;
}

export type SubskillTagKind = 'strength' | 'focus';

export interface SubskillTag {
  kind: SubskillTagKind;
  labelKey: string;
  tone: ViewTone;
}

/** Each vocabulary strand's band (its ACARA phase step), or null when not assessed. */
export interface VocabStrands {
  a2: AssessedBand | null;
  b1: AssessedBand | null;
}

/** A strongest/weakest skill, named with its band — the analysis states the phase, not the score. */
export interface AnalysisSkill extends ScoredSkill {
  band: AssessedBand;
}

export interface SubskillCard extends SkillRef {
  blurbKey: string;
  score: number | null;
  band: BandView | null;
  gate: GateView | null;
  barTone: ViewTone;
  delta: SubskillDelta;
  trajectory: number[];
  spark: SparklineGeometry;
  tag: SubskillTag | null;
}

export interface StudentDetailTiles {
  baseline: SeriesPoint | null;
  latest: { value: number | null; satAt: string | null };
  growth: GrowthView;
  span: ScoreSpan | null;
  sittings: { count: number; since: string | null };
}

export interface StudentAnalysis {
  strongest: AnalysisSkill | null;
  weakest: AnalysisSkill | null;
  vocab: VocabStrands;
}

export interface StudentDetailView {
  resultDocumentId: string;
  overall: { score: number | null; growth: GrowthView };
  phase: PhaseView | null;
  tiles: StudentDetailTiles;
  series: SeriesPoint[];
  chart: StudentChartGeometry;
  subskills: SubskillCard[];
  analysis: StudentAnalysis;
}
