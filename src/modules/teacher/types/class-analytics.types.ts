import type { SubskillAverage } from '@/modules/results/lib/class-analytics';
import type { RosterRow } from '@/modules/results/types/roster.types';

/**
 * Screen B (dashboard §3, task 34) — props of the analytics panels. Both tabs
 * consume the ONE Screen A roster payload; no panel takes a classDocumentId
 * any more, because no panel issues a read.
 */

/** The Teaching insights tab: subskill mastery, strand means — over the roster rows. */
export interface TeachingInsightsPanelProps {
  rows: readonly RosterRow[];
  /** The export BUTTON's route parameter — never read from; no query lives here. */
  classDocumentId: string;
}

export interface SubskillMasteryListProps {
  averages: readonly SubskillAverage[];
  /** secure counts per skill, from the pure layer — "Mastered" as the API sent it. */
  secure: ReadonlyMap<string, number>;
  totalStudents: number;
}

export interface SubskillMasteryRowProps {
  entry: SubskillAverage;
  secure: number | null;
  totalStudents: number;
}

/** One strand-mean line of the vocabulary section: the mean and how many sat it. */
export interface VocabStrandMeanProps {
  strand: 'a2' | 'b1';
  mean: { average: number | null; assessed: number };
}

// The Progress tab's props live beside its view types; re-exported so the barrel's type exports resolve.
export type {
  ProgressAcaraSectionProps,
  ProgressMoverRowProps,
  ProgressTabPanelProps,
  ProgressWatchListProps,
  ProgressWatchVariant,
} from '@/modules/teacher/types/progress-tab.types';
