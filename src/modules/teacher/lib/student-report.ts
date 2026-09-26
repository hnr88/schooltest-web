import type {
  AssessedBand,
  AttributeName,
  DisplaySkill,
  ResultView,
} from '@schooltest/scoring-contracts';

import { DISPLAY_SKILL_ORDER, progressDelta } from '@/modules/results';

import {
  MOMENTUM_ACCELERATING_MIN,
  MOMENTUM_STEADY_MIN,
} from '@/modules/teacher/constants/student-report.constants';
import type {
  DrillDownBreakdownRow,
  DrillDownChartPoint,
  DrillDownGrowth,
  DrillDownMomentum,
  DrillDownProgressTiles,
} from '@/modules/teacher/types/student-report.types';

export function scoredChartPoints(view: ResultView): DrillDownChartPoint[] {
  return (view.history ?? []).flatMap((point) =>
    point.overall === null ? [] : [{ satAt: point.sat_at, overall: point.overall }],
  );
}

export function growthFromHistory(points: readonly DrillDownChartPoint[]): DrillDownGrowth {
  const first = points.at(0);
  const latest = points.at(-1);
  if (first === undefined || latest === undefined || first === latest) {
    return { delta: null, direction: null };
  }
  const delta = latest.overall - first.overall;
  return { delta, direction: progressDelta(delta).direction };
}

export function momentumOf(growth: DrillDownGrowth): DrillDownMomentum {
  const { delta } = growth;
  if (delta === null) return { kind: null, delta: null };
  if (delta < 0) return { kind: 'slipping', delta };
  if (delta < MOMENTUM_STEADY_MIN) return { kind: 'holding', delta };
  if (delta < MOMENTUM_ACCELERATING_MIN) return { kind: 'steady', delta };
  return { kind: 'accelerating', delta };
}

export function progressTilesOf(points: readonly DrillDownChartPoint[]): DrillDownProgressTiles {
  return { baseline: points.at(0) ?? null, latest: points.at(-1) ?? null, sittings: points.length };
}

function attributeBand(view: ResultView, attribute: AttributeName): AssessedBand | null {
  const entry = view.attributes[attribute];
  return entry === undefined || entry.status === 'not_assessed' ? null : entry.status;
}

function breakdownRow(view: ResultView, attribute: DisplaySkill): DrillDownBreakdownRow {
  if (attribute === 'Vocab_B2') {
    return {
      kind: 'band',
      attribute,
      band: view.academic_vocab.band,
      provisionalCut: view.academic_vocab.provisional_cut,
    };
  }
  if (attribute === 'Critical') {
    return { kind: 'gate', attribute, passed: view.gate.passed };
  }
  return { kind: 'band', attribute, band: attributeBand(view, attribute), provisionalCut: false };
}

export function breakdownRowsOf(view: ResultView): DrillDownBreakdownRow[] {
  return DISPLAY_SKILL_ORDER.map((attribute) => breakdownRow(view, attribute));
}
