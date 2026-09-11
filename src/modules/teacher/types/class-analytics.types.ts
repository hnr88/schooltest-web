import type { RosterRow } from '@/modules/results/types/roster.types';
import type { KpiCardProps } from '@/modules/teacher/types/teacher-kit.types';
import type {
  CohortView,
  InsightsKpis,
  MasteryRow,
  PairingsView,
  TeachingGroup,
  TeachingInsightsView,
} from '@/modules/teacher/types/v2-insights.types';

/**
 * Screen B (dashboard §3, task 34) — props of the analytics panels. Both tabs
 * consume the ONE Screen A roster payload the class-detail frame read.
 */

/** The Teaching insights tab: the roster rows, plus the class the diagnostic, activity and export read. */
export interface TeachingInsightsPanelProps {
  rows: readonly RosterRow[];
  classDocumentId: string;
}

/** `useTeachingInsights` — the tab's view model and whether any roster row carries a result. */
export interface TeachingInsightsState {
  view: TeachingInsightsView;
  hasResults: boolean;
  /** The class's latest reading sitting, whose activity trail the tab shows (null: none). */
  latestSittingId: string | null;
}

/** Reading mastery: the `readingMastery()` rows, already ranked. */
export interface SubskillMasteryListProps {
  rows: readonly MasteryRow[];
}

export interface SubskillMasteryRowProps {
  row: MasteryRow;
}

/** One strand-mean line of the vocabulary section: the mean and how many sat it. */
export interface VocabStrandMeanProps {
  strand: 'a2' | 'b1';
  mean: { average: number | null; assessed: number };
}

export interface InsightsKpiRowProps {
  kpis: InsightsKpis;
}

/** One KPI tile, tagged with the KPI it shows and the raw value behind it. */
export interface InsightsKpiTileProps extends Omit<KpiCardProps, 'variant'> {
  kpi: string;
  dataValue: string | number | null;
}

export interface CohortGlanceCardProps {
  cohort: CohortView;
}

export interface SuggestedPairingsCardProps {
  pairings: PairingsView;
}

export interface SuggestedGroupsCardProps {
  groups: readonly TeachingGroup[];
}

export interface RecentActivityCardProps {
  sittingDocumentId: string;
}

// The Progress tab's props live beside its view types; re-exported so the barrel's type exports resolve.
export type {
  ProgressAcaraSectionProps,
  ProgressMoverRowProps,
  ProgressTabPanelProps,
  ProgressWatchListProps,
  ProgressWatchVariant,
} from '@/modules/teacher/types/progress-tab.types';
