import { ACARA_BAND_RANGES } from '@/modules/teacher/constants/v2-chart.constants';
import type { AcaraPhaseName } from '@/modules/teacher/types/v2-view-common.types';

const ASCENDING_BANDS = [...ACARA_BAND_RANGES].sort((a, b) => a.bottom - b.bottom);

function bandIndexOf(score: number): number {
  let index = 0;
  ASCENDING_BANDS.forEach((range, at) => {
    if (score >= range.bottom) index = at;
  });
  return index;
}

export function bandOf(score: number): AcaraPhaseName {
  return ASCENDING_BANDS[bandIndexOf(score)].phase;
}

export function bandPosition(score: number): number {
  const index = bandIndexOf(score);
  const range = ASCENDING_BANDS[index];
  const within = Math.min(1, Math.max(0, (score - range.bottom) / (range.top - range.bottom)));
  return (index + within) / ASCENDING_BANDS.length;
}

export function monthOf(satAt: string): number {
  return Number.parseInt(satAt.slice(5, 7), 10);
}
