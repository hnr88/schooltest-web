import type { RosterRow } from '@/modules/results/types/roster.types';
import type { ClassChartGeometry } from '@/modules/teacher/types/v2-chart.types';
import type {
  DotMapView,
  MoverCounts,
  ProgressMover,
  SubSkillMap,
  SubskillTrend,
} from '@/modules/teacher/types/v2-class-tabs.types';

/** The Class progress tab: the class detail's roster rows; the panel issues no read of its own. */
export interface ProgressTabPanelProps {
  rows: readonly RosterRow[];
  /** The class shown, echoed on the panel as `data-class-id`. */
  classDocumentId: string;
}

/** `progressTabView()` — everything the tab prints, from the one roster read. */
export interface ProgressTabView {
  status: 'ready' | 'empty';
  sittings: number;
  dotMap: DotMapView;
  subMap: SubSkillMap[];
  gainTop: ProgressMover[];
  gainLow: ProgressMover[];
  analysis: MoverCounts;
}

/** §3b "Reading progress by student": the view model's dot map, straight from the panel. */
export interface ProgressDotMapProps {
  dotMap: DotMapView;
}

/** §3c the two gains cards: the server-delta rankings, ≤4 each. */
export interface ProgressGainsCardsProps {
  top: readonly ProgressMover[];
  low: readonly ProgressMover[];
}

/** §3d "Subskill growth by student": one map per band-carrying subskill, chips pick. */
export interface ProgressSubskillGrowthProps {
  maps: readonly SubSkillMap[];
}

/** §3e "Class analysis": the reliable-mover tally; the prose itself is a coming-soon state. */
export interface ProgressClassAnalysisProps {
  counts: MoverCounts;
}

/** The sentence under the class chart, as a `TeacherPortal.progress` key and its values. */
export type ProgressSummaryText =
  | { key: 'chart.summary'; values: { from: number; to: number; count: number; difference: string } }
  | { key: 'chart.summarySingle'; values: { value: number } }
  | { key: 'chart.summaryEmpty'; values: Record<string, never> };

/** "Class reading over time": the banded chart and the sentence under it. */
export interface ProgressAcaraSectionProps {
  chart: ClassChartGeometry;
  summary: ProgressSummaryText;
}

export interface ProgressClassChartProps {
  chart: ClassChartGeometry;
}

/** One student in Top progress / Students to watch. */
export interface ProgressMoverRowProps {
  mover: ProgressMover;
}

/** Which list card of the Progress tab — a closed set, never a free string. */
export type ProgressWatchVariant = 'gains' | 'support';

/** Top progress (`gains`) or Students to watch (`support`): the view model's movers, in order. */
export interface ProgressWatchListProps {
  variant: ProgressWatchVariant;
  movers: readonly ProgressMover[];
}

/** "Subskill movement over time": the subskills with a class mean on record. */
export interface ProgressSubskillTrendsProps {
  trends: readonly SubskillTrend[];
}
