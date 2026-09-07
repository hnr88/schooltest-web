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

/** The Progress tab: reliable gains, needs support, phase spread, deferred chart. */
export interface ProgressTabPanelProps {
  rows: readonly RosterRow[];
  /** The export BUTTON's route parameter — never read from; no query lives here. */
  classDocumentId: string;
}

export interface ProgressAcaraSectionProps {
  rows: readonly RosterRow[];
}

/** One top-gain row: the roster row wrapper, so the student is named beside the delta. */
export interface ProgressMoverRowProps {
  row: RosterRow;
}

/** Which ranked list of the Progress tab — a closed set, never a free string. */
export type ProgressWatchVariant = 'gains' | 'support';

/** The needs-support list: ranked wrapper rows from the pure layer, capped at 5. */
export interface ProgressWatchListProps {
  variant: ProgressWatchVariant;
  rows: readonly RosterRow[];
}
