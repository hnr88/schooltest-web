import type { MASTERY_AREA_CODES } from '@/modules/teach/constants/lib.constants';

export type HeatmapTone = 'success' | 'warning' | 'danger';

/** One of the seven teach reading areas (`constants/lib.constants.ts`). */
export type MasteryAreaCode = (typeof MASTERY_AREA_CODES)[number];
