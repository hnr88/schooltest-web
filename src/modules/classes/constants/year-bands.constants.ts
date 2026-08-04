import type { YearBand } from '@/modules/classes/types/constants.types';

// The platform's two year bands (api: session-presets yearBandOf + the seeded
// item meta use exactly these codes). The class schema stores year_band as a
// free string, but the form constrains new writes to the platform set.
export const YEAR_BANDS = ['7_9', '10_12'] as const;

export function isYearBand(value: string): value is YearBand {
  return (YEAR_BANDS as readonly string[]).includes(value);
}
