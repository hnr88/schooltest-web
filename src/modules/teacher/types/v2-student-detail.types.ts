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

export interface VocabStrands {
  a2: number | null;
  b1: number | null;
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
  strands: VocabStrands | null;
}

export interface StudentDetailTiles {
  baseline: SeriesPoint | null;
  latest: { value: number | null; satAt: string | null };
  growth: GrowthView;
  span: ScoreSpan | null;
  sittings: { count: number; since: string | null };
}

export interface StudentAnalysis {
  strongest: ScoredSkill | null;
  weakest: ScoredSkill | null;
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
