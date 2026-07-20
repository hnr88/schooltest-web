import { FEE_MAX_BOUND, FEE_MIN_BOUND } from '@/modules/school-search/constants/school-search.constants';

function toBoundedFee(value: string, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(FEE_MAX_BOUND, Math.max(FEE_MIN_BOUND, parsed));
}

export function nextMinimumFee(value: string, currentMaximum: number): number {
  return Math.min(toBoundedFee(value, FEE_MIN_BOUND), currentMaximum);
}

export function nextMaximumFee(value: string, currentMinimum: number): number {
  return Math.max(toBoundedFee(value, FEE_MAX_BOUND), currentMinimum);
}

export function toFeeThousands(value: number): number {
  return Math.round(value / 1000);
}
