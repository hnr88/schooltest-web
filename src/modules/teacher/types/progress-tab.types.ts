import type { RosterRow } from '@/modules/results/types/roster.types';
import type { KpiCardTone } from '@/modules/teacher/types/teacher-kit.types';
import type { ClassChartGeometry } from '@/modules/teacher/types/v2-chart.types';
import type { ProgressMover, ProgressTileId, SubskillTrend } from '@/modules/teacher/types/v2-class-tabs.types';

/** The Class progress tab: the class detail's roster rows; the panel issues no read of its own. */
export interface ProgressTabPanelProps {
  rows: readonly RosterRow[];
  /** The class shown, echoed on the panel as `data-class-id`. */
  classDocumentId: string;
}

/** One progress tile as printed: its kit tone and its text (`null` = the kit dash). */
export interface ProgressTileDisplay {
  id: ProgressTileId;
  tone: KpiCardTone;
  text: string | null;
  /** Mean shift prints its step with the "pts" unit. */
  points: boolean;
}

/** The sentence under the class chart, as a `TeacherPortal.progress` key and its values. */
export type ProgressSummaryText =
  | { key: 'chart.summary'; values: { from: number; to: number; count: number; difference: string } }
  | { key: 'chart.summarySingle'; values: { value: number } }
  | { key: 'chart.summaryEmpty'; values: Record<string, never> };

/** `progressTabView()` — everything the tab prints, from the one roster read. */
export interface ProgressTabView {
  status: 'ready' | 'empty';
  sittings: number;
  tiles: ProgressTileDisplay[];
  chart: ClassChartGeometry;
  summary: ProgressSummaryText;
  topProgress: ProgressMover[];
  watch: ProgressMover[];
  trends: SubskillTrend[];
}

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
