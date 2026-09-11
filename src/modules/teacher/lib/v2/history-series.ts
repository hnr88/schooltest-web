import type { DisplaySkill, ResultHistoryPoint, ResultView } from '@schooltest/scoring-contracts';

import type { ClassSeriesPoint, SeriesPoint } from '@/modules/teacher/types/v2-view-common.types';

export type HistoryValue = (point: ResultHistoryPoint) => number | null;

interface SeriesSlot {
  sum: number;
  count: number;
  satAt: string | null;
}

export const overallOf: HistoryValue = (point) => point.overall;

export function skillOf(skill: DisplaySkill): HistoryValue {
  return (point) => point.attributes[skill];
}

export function studentSeries(result: ResultView, value: HistoryValue): SeriesPoint[] {
  return (result.history ?? []).flatMap((point, index) => {
    const reading = value(point);
    return reading === null ? [] : [{ n: index + 1, satAt: point.sat_at, value: reading }];
  });
}

export function alignedClassSeries(results: readonly ResultView[], value: HistoryValue): ClassSeriesPoint[] {
  const span = Math.max(0, ...results.map((result) => result.history?.length ?? 0));
  const slots: SeriesSlot[] = Array.from({ length: span }, () => ({ sum: 0, count: 0, satAt: null }));
  for (const result of results) {
    const history = result.history ?? [];
    history.forEach((point, index) => {
      const reading = value(point);
      if (reading === null) return;
      const slot = slots[span - history.length + index];
      slot.sum += reading;
      slot.count += 1;
      if (slot.satAt === null || point.sat_at > slot.satAt) slot.satAt = point.sat_at;
    });
  }
  return slots.flatMap((slot, index) =>
    slot.count === 0
      ? []
      : [{ n: index + 1, satAt: slot.satAt, value: Math.round(slot.sum / slot.count), contributors: slot.count }],
  );
}

export function latestSatAt(results: readonly ResultView[]): string | null {
  let latest: string | null = null;
  for (const result of results) {
    for (const point of result.history ?? []) {
      if (latest === null || point.sat_at > latest) latest = point.sat_at;
    }
  }
  return latest;
}
