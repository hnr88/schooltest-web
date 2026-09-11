import type { ClassChartGeometry, SparklineGeometry } from '@/modules/teacher/types/v2-chart.types';
import type {
  ClassSeriesPoint,
  GrowthView,
  PhaseView,
  ScoreSpan,
  ScoredSkill,
  SkillRef,
} from '@/modules/teacher/types/v2-view-common.types';

export type StudentsSort = 'name' | 'high' | 'low' | 'phase';

export interface StudentsTabOptions {
  query?: string;
  sort?: StudentsSort;
}

export interface StudentsTabRow {
  studentDocumentId: string;
  resultDocumentId: string | null;
  name: string;
  initials: string;
  ealdFlag: boolean;
  score: number | null;
  growth: GrowthView;
  weakest: ScoredSkill | null;
  phase: PhaseView | null;
  hasResult: boolean;
  isScored: boolean;
}

export interface StudentsTabView {
  rows: StudentsTabRow[];
  total: number;
  matched: number;
  scored: number;
}

export type ProgressTileId = 'meanShift' | 'gained' | 'held' | 'slipped';

export interface ProgressTile {
  id: ProgressTileId;
  value: number | null;
  fg: string;
}

export interface MeanShift {
  value: number | null;
  paired: number;
}

export interface ProgressMover {
  studentDocumentId: string;
  name: string;
  firstName: string;
  score: number | null;
  growth: GrowthView;
}

export interface SubskillTrend extends SkillRef {
  values: number[];
  now: number | null;
  difference: number | null;
  differenceFg: string;
  stroke: string;
  spark: SparklineGeometry;
}

export interface ClassProgressSummary extends ScoreSpan {
  sittings: number;
}

export interface ClassProgressView {
  tiles: ProgressTile[];
  paired: number;
  series: ClassSeriesPoint[];
  chart: ClassChartGeometry;
  summary: ClassProgressSummary | null;
  topProgress: ProgressMover[];
  watch: ProgressMover[];
  subskillTrends: SubskillTrend[];
}
