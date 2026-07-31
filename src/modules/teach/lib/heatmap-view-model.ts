// Item-type heat map view model (task 75, mvp-updates §4.9 + §5): the heat map
// is evidence, not a second score — cells are keyed by item code + section
// only, framed as items correct / responses, and colour-bucketed relative to
// the ~25% chance floor of a four-option guessing strategy. The exact
// cut-offs live here and nowhere else, so the grid never re-derives them.

/** ~25% chance floor: below this the class is performing at guessing level. */
export const HEATMAP_CHANCE_FLOOR = 0.25;

/** At or above this the cell reads as secure; between the floor and this it reads as mixed. */
export const HEATMAP_SECURE_CUT = 0.6;

export type HeatmapTone = 'success' | 'warning' | 'danger';

export function heatmapTone(fraction: number): HeatmapTone {
  if (fraction < HEATMAP_CHANCE_FLOOR) return 'danger';
  if (fraction < HEATMAP_SECURE_CUT) return 'warning';
  return 'success';
}

// Deliberately different chrome from the mastery view (bordered grid tiles on
// soft tints) so the eye never equates the evidence grid with a mastery list.
export const HEATMAP_TONE_CLASSES: Record<HeatmapTone, string> = {
  success: 'border-success/40 bg-success-soft text-success-ink',
  warning: 'border-warning/40 bg-warning-soft text-warning-ink',
  danger: 'border-danger/40 bg-danger-soft text-danger-ink',
};

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
