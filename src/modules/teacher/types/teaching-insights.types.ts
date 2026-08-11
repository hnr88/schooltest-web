import type { InsightGroup, InsightMastery } from '@/modules/teacher/types/teacher-result.types';

export interface TeachingInsightsPanelProps {
  classDocumentId: string;
}

export interface SubskillMasteryListProps {
  mastery: readonly InsightMastery[];
  completedCount: number;
}

export interface SubskillMasteryRowProps {
  entry: InsightMastery;
}

export interface SuggestedGroupsSectionProps {
  groups: readonly InsightGroup[];
}

export interface SuggestedGroupCardProps {
  group: InsightGroup;
}

/**
 * How one mastery bar may be drawn. `assessed: false` is the HONEST no-measurement
 * state — C-TR-3's `assessed_count` excludes students the attribute was never
 * administered to, so a `0 / 0` row must render an EMPTY track, never a
 * zero-length bar that reads as "nobody mastered it". `percent` scales the
 * server's own `ratio` for the bar's WIDTH only; it is never compared to a cut.
 */
export type MasteryBarView = { assessed: false } | { assessed: true; percent: number };
