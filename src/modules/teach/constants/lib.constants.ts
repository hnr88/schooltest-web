import type { HeatmapTone } from '@/modules/teach/types/lib.types';

export const HEATMAP_CHANCE_FLOOR = 0.25;

export const HEATMAP_SECURE_CUT = 0.6;

export const HEATMAP_TONE_CLASSES: Record<HeatmapTone, string> = {
  success: 'border-success/40 bg-success-soft text-success-ink',
  warning: 'border-warning/40 bg-warning-soft text-warning-ink',
  danger: 'border-danger/40 bg-danger-soft text-danger-ink',
};
