import type { HeatmapTone } from '@/modules/teach/types/lib.types';

export const HEATMAP_CHANCE_FLOOR = 0.25;

export const HEATMAP_SECURE_CUT = 0.6;

export const HEATMAP_TONE_CLASSES: Record<HeatmapTone, string> = {
  success: 'border-success/40 bg-success-soft text-success-ink',
  warning: 'border-warning/40 bg-warning-soft text-warning-ink',
  danger: 'border-danger/40 bg-danger-soft text-danger-ink',
};

// The eight teach reading areas, in the product-wide display order every
// diagnostic surface columns and lists them. Everyday (Vocab_A2) and Classroom
// (Vocab_B1) Vocabulary are two areas, never one blended Vocabulary (BUG-008). A
// live C-RPT-01 cell names itself either by an area code (an unscored student)
// or by a model attribute (a scored one); `lib/diagnostic-areas.ts` places either
// on its area. The constant lives here rather than beside the directory config so
// the placement helper and that config can both read it without importing each
// other.
export const MASTERY_AREA_CODES = ['R1', 'Vocab_A2', 'R3', 'Vocab_B1', 'R4', 'R5', 'R6', 'R7'] as const;
