import type { AssessedBand, DisplaySkill } from '@schooltest/scoring-contracts';

import type { SparklineGeometry } from '@/modules/teacher/types/v2-chart.types';
import type {
  AcaraPhaseName,
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

/** Why a row that holds a result has no score — the reasons the desktop results surfaces state. */
export type StudentNoScoreReason = 'no_answers' | 'incomplete' | 'pending' | 'failed';

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
  /** Null when scored or when there is no result at all. */
  noScoreReason: StudentNoScoreReason | null;
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

export type DotMovement = 'up' | 'back' | 'held';

export interface DotMapEndpoint {
  score: number;
  satAt: string;
  month: number;
  phase: AcaraPhaseName;
  position: number;
}

export interface DotMapRow {
  studentDocumentId: string;
  name: string;
  firstName: string;
  first: DotMapEndpoint;
  latest: DotMapEndpoint;
  sittings: number;
  movement: DotMovement;
}

export interface DotMapPhaseCount {
  phase: AcaraPhaseName;
  count: number;
}

export interface MoverCounts {
  up: number;
  held: number;
  down: number;
}

export interface DotMapView {
  rows: DotMapRow[];
  phases: DotMapPhaseCount[];
  summary: MoverCounts;
}

/** Which way a §3d subskill row moves: band rank of the latest sitting against the first. */
export type SubMapMove = 'up' | 'held' | 'down';

/** One end of a subskill arrow row: the SERVER band at that sitting and its month (null when the history point is absent). */
export interface SubMapEndpoint {
  band: AssessedBand;
  month: number | null;
}

/** One §3d row: phases only, no %. `first` is null when the first sitting predates the server's `attribute_bands` (BUG-009) — the row then degrades to a dot at the latest band and asserts no movement. */
export interface SubMapRow {
  studentDocumentId: string;
  name: string;
  firstName: string;
  first: SubMapEndpoint | null;
  latest: SubMapEndpoint;
  movement: SubMapMove;
  /** |BAND_RANK(latest) − BAND_RANK(first)|; 0 when the first band is absent. */
  phases: number;
}

/** §3d's band header: students whose LATEST band on the selected subskill equals `band`. */
export interface SubMapPhaseCount {
  band: AssessedBand;
  count: number;
}

/** "Subskill growth by student" for ONE subskill: the rows, the latest-band counts and the mover tally. */
export interface SubSkillMap {
  skill: DisplaySkill;
  rows: SubMapRow[];
  phases: SubMapPhaseCount[];
  summary: MoverCounts;
}

export interface ClassProgressView {
  sittings: number;
  dotMap: DotMapView;
  subMap: SubSkillMap[];
  gainTop: ProgressMover[];
  gainLow: ProgressMover[];
}
