import type { ResultView } from '@schooltest/scoring-contracts';

import { getStudentFirstName } from '@/lib/student-name';
import { needsSupport, resultViewsOf, topGains, type RosterRow } from '@/modules/results';

import { PROGRESS_LIST_SIZE, PROGRESS_TILE_THRESHOLD } from '@/modules/teacher/constants/v2-thresholds.constants';
import { GROWTH_FG, PROGRESS_TILE_FG } from '@/modules/teacher/constants/v2-tones.constants';
import { acaraChart } from '@/modules/teacher/lib/v2/chart-geometry';
import { growthCounts, growthFromServer, meanShift, scoreSpan, serverDeltas } from '@/modules/teacher/lib/v2/growth';
import { alignedClassSeries, overallOf } from '@/modules/teacher/lib/v2/history-series';
import { subskillTrends } from '@/modules/teacher/lib/v2/subskill-trends';
import type {
  ClassProgressSummary,
  ClassProgressView,
  ProgressMover,
  ProgressTile,
} from '@/modules/teacher/types/v2-class-tabs.types';
import type { ClassSeriesPoint } from '@/modules/teacher/types/v2-view-common.types';

function shiftFg(value: number | null): string {
  if (value === null) return GROWTH_FG.none;
  return value >= 0 ? PROGRESS_TILE_FG.gained : PROGRESS_TILE_FG.slipped;
}

function progressTiles(results: readonly ResultView[]): ProgressTile[] {
  const shift = meanShift(results);
  const counts = growthCounts(serverDeltas(results), PROGRESS_TILE_THRESHOLD);
  return [
    { id: 'meanShift', value: shift.value, fg: shiftFg(shift.value) },
    { id: 'gained', value: counts.up, fg: PROGRESS_TILE_FG.gained },
    { id: 'held', value: counts.held, fg: PROGRESS_TILE_FG.held },
    { id: 'slipped', value: counts.down, fg: PROGRESS_TILE_FG.slipped },
  ];
}

function moversFrom(roster: readonly RosterRow[], ranked: readonly ResultView[]): ProgressMover[] {
  const rowsByResult = new Map(
    roster.flatMap((row) => (row.result === null ? [] : [[row.result.document_id, row] as const])),
  );
  return ranked.slice(0, PROGRESS_LIST_SIZE).flatMap((result) => {
    const row = rowsByResult.get(result.document_id);
    if (row === undefined) return [];
    return [
      {
        studentDocumentId: row.student.document_id,
        name: row.student.name,
        firstName: getStudentFirstName(row.student.name),
        score: result.overall.domain_score,
        growth: growthFromServer(result.overall),
      },
    ];
  });
}

function summaryOf(series: readonly ClassSeriesPoint[]): ClassProgressSummary | null {
  const first = series.at(0);
  const last = series.at(-1);
  if (series.length < 2 || first === undefined || last === undefined) return null;
  const span = scoreSpan(first.value, last.value);
  return span === null ? null : { ...span, sittings: series.length };
}

export function classProgress(roster: readonly RosterRow[]): ClassProgressView {
  const results = resultViewsOf(roster);
  const series = alignedClassSeries(results, overallOf);
  return {
    tiles: progressTiles(results),
    paired: meanShift(results).paired,
    series,
    chart: acaraChart(series),
    summary: summaryOf(series),
    topProgress: moversFrom(roster, topGains(results)),
    watch: moversFrom(roster, needsSupport(results)),
    subskillTrends: subskillTrends(results),
  };
}
