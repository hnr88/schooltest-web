import type { HeatmapTone } from '@/modules/teach/types/lib.types';
import { HEATMAP_CHANCE_FLOOR, HEATMAP_SECURE_CUT, HEATMAP_TONE_CLASSES } from '@/modules/teach/constants/lib.constants';

export function heatmapTone(fraction: number): HeatmapTone {
  if (fraction < HEATMAP_CHANCE_FLOOR) return 'danger';
  if (fraction < HEATMAP_SECURE_CUT) return 'warning';
  return 'success';
}

/** "8/10 (80%)" — fraction and percentage, never a bare score. */
export function formatHeatmapValue(correct: number, responses: number, fraction: number): string {
  return `${correct}/${responses} (${Math.round(fraction * 100)}%)`;
}

/** Sections arrive sorted ascending; group rows so each section renders its own grid. */
export function groupBySection<T extends { section: number }>(rows: T[]): Map<number, T[]> {
  const groups = new Map<number, T[]>();
  for (const row of rows) {
    const group = groups.get(row.section) ?? [];
    group.push(row);
    groups.set(row.section, group);
  }
  return groups;
}
