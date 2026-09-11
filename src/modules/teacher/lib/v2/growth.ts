import type { ResultView } from '@schooltest/scoring-contracts';

import { progressDelta } from '@/modules/results';

import { GROWTH_FG } from '@/modules/teacher/constants/v2-tones.constants';
import type { MeanShift } from '@/modules/teacher/types/v2-class-tabs.types';
import type { GrowthKind, GrowthSource, GrowthView, ScoreSpan } from '@/modules/teacher/types/v2-view-common.types';

const SIGNED_STEP = /^([+\-−])?(\d+(?:\.\d+)?)$/;

export interface GrowthCounts {
  up: number;
  held: number;
  down: number;
  paired: number;
}

export function parseSignedDisplay(display: string | null): number | null {
  if (display === null) return null;
  const match = SIGNED_STEP.exec(display.trim());
  if (match === null) return null;
  const magnitude = Number(match[2]);
  return match[1] === '-' || match[1] === '−' ? -magnitude : magnitude;
}

function growthView(kind: GrowthKind, source: GrowthSource | null, points: number | null): GrowthView {
  return {
    kind,
    delta: source === null ? null : source.delta,
    points,
    reliable: source === null ? null : source.delta_reliable,
    fg: GROWTH_FG[kind],
  };
}

export function growthFromServer(source: GrowthSource | null): GrowthView {
  if (source === null || source.delta_display === 'band_movement') return growthView('none', source, null);
  if (source.delta_display === 'steady') return growthView('steady', source, null);
  if (source.delta_reliable === false) return growthView(source.delta === null ? 'none' : 'steady', source, null);
  const points = parseSignedDisplay(source.delta_display) ?? source.delta;
  if (points === null) return growthView('none', source, null);
  return growthView(progressDelta(points).direction, source, points);
}

export function signedFg(value: number | null): string {
  return value === null ? GROWTH_FG.none : GROWTH_FG[progressDelta(value).direction];
}

export function scoreSpan(from: number | null, to: number | null): ScoreSpan | null {
  return from === null || to === null ? null : { from, to, difference: to - from };
}

export function serverDeltas(results: readonly ResultView[]): number[] {
  return results.flatMap((result) => (result.overall.delta === null ? [] : [result.overall.delta]));
}

export function meanShift(results: readonly ResultView[]): MeanShift {
  const deltas = serverDeltas(results);
  const total = deltas.reduce((sum, delta) => sum + delta, 0);
  return { value: deltas.length === 0 ? null : Math.round(total / deltas.length), paired: deltas.length };
}

export function growthCounts(deltas: readonly number[], threshold: number): GrowthCounts {
  return {
    up: deltas.filter((delta) => delta >= threshold).length,
    held: deltas.filter((delta) => Math.abs(delta) < threshold).length,
    down: deltas.filter((delta) => delta <= -threshold).length,
    paired: deltas.length,
  };
}
