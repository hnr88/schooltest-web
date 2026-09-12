import type { HeatmapTone } from '@/modules/teach/types/lib.types';

export const HEATMAP_CHANCE_FLOOR = 0.25;

export const HEATMAP_SECURE_CUT = 0.6;

export const HEATMAP_TONE_CLASSES: Record<HeatmapTone, string> = {
  success: 'border-success/40 bg-success-soft text-success-ink',
  warning: 'border-warning/40 bg-warning-soft text-warning-ink',
  danger: 'border-danger/40 bg-danger-soft text-danger-ink',
};

// The seven teach reading areas, in the order every diagnostic surface columns
// and lists them (`Teach.diagnostic.areas.*`). A live C-RPT-01 cell names itself
// either by one of these codes (an unscored student) or by a model attribute (a
// scored one); `lib/diagnostic-areas.ts` places either on its area. The constant
// lives here rather than beside the directory config so the placement helper and
// that config can both read it without importing each other.
export const MASTERY_AREA_CODES = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7'] as const;
