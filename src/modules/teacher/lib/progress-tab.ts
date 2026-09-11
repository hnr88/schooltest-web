import { resultViewsOf, type RosterRow } from '@/modules/results';

import { PROGRESS_TILE_TONE } from '@/modules/teacher/constants/progress-tab.constants';
import { classProgress } from '@/modules/teacher/lib/v2/class-progress';
import type {
  ProgressSummaryText,
  ProgressTabView,
  ProgressTileDisplay,
} from '@/modules/teacher/types/progress-tab.types';
import type { KpiCardTone } from '@/modules/teacher/types/teacher-kit.types';
import type { ClassProgressSummary, ProgressTile, ProgressTileId } from '@/modules/teacher/types/v2-class-tabs.types';
import type { ClassSeriesPoint } from '@/modules/teacher/types/v2-view-common.types';

const MINUS = '−';

/** The design's signed step for Mean shift and the summary (`:3922`, `:3926`): "+0", "+12", "−3" (true minus). */
export function signedStep(value: number): string {
  return value < 0 ? `${MINUS}${Math.abs(value)}` : `+${value}`;
}

function tileTone(tile: ProgressTile): KpiCardTone {
  if (tile.id !== 'meanShift') return PROGRESS_TILE_TONE[tile.id];
  if (tile.value === null) return 'navy';
  return tile.value >= 0 ? 'success' : 'danger';
}

function tileText(id: ProgressTileId, value: number | null): string | null {
  if (value === null) return null;
  return id === 'meanShift' ? signedStep(value) : String(value);
}

/**
 * The four tiles as printed. With no student carrying a server delta there is no
 * comparison at all, so every tile is the dash in navy — never "0 gained" of nobody.
 */
export function progressTiles(tiles: readonly ProgressTile[], paired: number): ProgressTileDisplay[] {
  return tiles.map((tile) => {
    const text = tileText(tile.id, paired === 0 ? null : tile.value);
    return { id: tile.id, tone: text === null ? 'navy' : tileTone(tile), text, points: tile.id === 'meanShift' };
  });
}

/** The line under the chart: first → last plotted class mean, one sitting's mean, or nothing scored yet. */
export function progressSummary(
  series: readonly ClassSeriesPoint[],
  summary: ClassProgressSummary | null,
): ProgressSummaryText {
  if (summary !== null) {
    return {
      key: 'chart.summary',
      values: { from: summary.from, to: summary.to, count: summary.sittings, difference: signedStep(summary.difference) },
    };
  }
  const [only] = series;
  if (series.length === 1 && only !== undefined) return { key: 'chart.summarySingle', values: { value: only.value } };
  return { key: 'chart.summaryEmpty', values: {} };
}

/** The Class progress tab (`:873–1002`) from the ONE roster read: `classProgress()` shaped for the kit. */
export function progressTabView(roster: readonly RosterRow[]): ProgressTabView {
  const view = classProgress(roster);
  return {
    status: resultViewsOf(roster).length === 0 ? 'empty' : 'ready',
    sittings: view.series.length,
    tiles: progressTiles(view.tiles, view.paired),
    chart: view.chart,
    summary: progressSummary(view.series, view.summary),
    topProgress: view.topProgress,
    watch: view.watch,
    trends: view.subskillTrends.filter((trend) => trend.values.length > 0),
  };
}
