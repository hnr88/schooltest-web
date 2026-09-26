import { getStudentFirstName } from '@/lib/student-name';
import type { RosterRow } from '@/modules/results';
import { PHASE_ORDER } from '@/modules/teacher/constants/v2-thresholds.constants';
import { bandOf, bandPosition, monthOf } from '@/modules/teacher/lib/v2/progress/band-placement';
import type {
  DotMapEndpoint,
  DotMapPhaseCount,
  DotMapRow,
  DotMapView,
  DotMovement,
  MoverCounts,
} from '@/modules/teacher/types/v2-class-tabs.types';
import type { AcaraPhaseName } from '@/modules/teacher/types/v2-view-common.types';
import type { ResultHistoryPoint, ResultView } from '@schooltest/scoring-contracts';

type ScoredPoint = ResultHistoryPoint & { overall: number };

function scoredPoints(result: ResultView): ScoredPoint[] {
  return (result.history ?? []).filter(
    (point): point is ScoredPoint => point.overall !== null,
  );
}

function endpointOf(point: ScoredPoint): DotMapEndpoint {
  return {
    score: point.overall,
    satAt: point.sat_at,
    month: monthOf(point.sat_at),
    phase: bandOf(point.overall),
    position: bandPosition(point.overall),
  };
}

function movementOf(result: ResultView, first: number, latest: number, sittings: number): DotMovement {
  if (result.overall.delta_reliable !== true || sittings < 2 || latest === first) return 'held';
  return latest > first ? 'up' : 'back';
}

function rowOf(row: RosterRow): DotMapRow[] {
  const { result } = row;
  if (result === null) return [];
  const points = scoredPoints(result);
  const first = points[0];
  const last = points.at(-1);
  if (first === undefined || last === undefined) return [];
  return [
    {
      studentDocumentId: row.student.document_id,
      name: row.student.name,
      firstName: getStudentFirstName(row.student.name),
      first: endpointOf(first),
      latest: endpointOf(last),
      sittings: points.length,
      movement: movementOf(result, first.overall, last.overall, points.length),
    },
  ];
}

function phaseRank(phase: AcaraPhaseName): number {
  return PHASE_ORDER.indexOf(phase);
}

function phaseCounts(rows: readonly DotMapRow[]): DotMapPhaseCount[] {
  return PHASE_ORDER.map((phase) => ({
    phase,
    count: rows.filter((row) => row.latest.phase === phase).length,
  }));
}

function summaryOf(rows: readonly DotMapRow[]): MoverCounts {
  const up = rows.filter(
    (row) => row.movement === 'up' && phaseRank(row.latest.phase) > phaseRank(row.first.phase),
  ).length;
  const down = rows.filter(
    (row) => row.movement === 'back' && phaseRank(row.latest.phase) < phaseRank(row.first.phase),
  ).length;
  return { up, held: rows.length - up - down, down };
}

export function dotMapOf(roster: readonly RosterRow[]): DotMapView {
  const rows = roster
    .flatMap(rowOf)
    .sort((a, b) => b.latest.score - a.latest.score);
  return { rows, phases: phaseCounts(rows), summary: summaryOf(rows) };
}

export function maxSittings(results: readonly ResultView[]): number {
  return Math.max(0, ...results.map((result) => scoredPoints(result).length));
}
