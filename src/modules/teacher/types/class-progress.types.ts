import type {
  AcaraMovement,
  AcaraMovementDetail,
  ClassProgressResponse,
  ProgressCohort,
  ProgressMover,
  ProgressSubskillShift,
  ProgressSummary,
} from '@/modules/teacher/types/teacher-progress.types';

/**
 * The SIGN of a Test A → Test B difference — nothing else. It is read off a
 * number the server already computed (`avg_delta`, `change`, `delta`) and it is
 * NOT a band: no mastery cut is applied client-side anywhere on this tab.
 */
export type ProgressDirection = 'up' | 'flat' | 'down';

/** Mutually exclusive states of the C-TR-4 read: error beats pending. */
export type ProgressReadStatus = 'loading' | 'error' | 'unavailable' | 'ready' | 'drift';

export interface ProgressReadCounts {
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  data: ClassProgressResponse | undefined;
}

/**
 * C-TR-4 narrowed to what each state can actually render.
 *
 * `unavailable` is the server's own `available: false` — the empty state, with
 * the REAL cohort counts it still carries. `drift` is `available: true` with a
 * `null` summary or `null` acara_movement: the contract forbids it, so the tab
 * says so out loud instead of drawing zeros.
 */
export type ProgressView =
  | { kind: 'unavailable'; cohort: ProgressCohort }
  | { kind: 'drift'; cohort: ProgressCohort }
  | {
      kind: 'ready';
      cohort: ProgressCohort;
      summary: ProgressSummary;
      movement: AcaraMovement;
      shift: readonly ProgressSubskillShift[];
      mostImproved: readonly ProgressMover[];
      needsAttention: readonly ProgressMover[];
      /** improved + unchanged + regressed — the students actually compared. */
      compared: number;
    };

/** The three ACARA phase-movement cards, in wireframe order. */
export type ProgressAcaraCardKey = 'up' | 'same' | 'down';

export interface ProgressAcaraCard {
  key: ProgressAcaraCardKey;
  count: number;
  detail: readonly AcaraMovementDetail[];
  /** `same` only: how many of those students improved inside their phase. */
  improvedWithinPhase: number | null;
}

/** One cell of the populated stat row (label / value / direction). */
export interface ProgressStatItem {
  key: string;
  label: string;
  value: string;
  direction: ProgressDirection | null;
  change: string | null;
}

export interface ProgressTabPanelProps {
  classDocumentId: string;
}

export interface ProgressEmptyStateProps {
  cohort: ProgressCohort;
}

export interface ProgressSummarySectionProps {
  cohort: ProgressCohort;
  summary: ProgressSummary;
  compared: number;
}

export interface ProgressStatCellProps {
  item: ProgressStatItem;
}

/** `change` is the already-formatted MAGNITUDE of a server-sent difference. */
export interface ProgressDeltaPillProps {
  direction: ProgressDirection;
  change: string;
}

export interface ProgressShiftTableProps {
  shift: readonly ProgressSubskillShift[];
  compared: number;
}

export interface ProgressShiftRowProps {
  entry: ProgressSubskillShift;
  compared: number;
}

export interface ProgressAcaraSectionProps {
  movement: AcaraMovement;
}

export interface ProgressAcaraCardProps {
  card: ProgressAcaraCard;
}

export interface ProgressWatchSectionProps {
  mostImproved: readonly ProgressMover[];
  needsAttention: readonly ProgressMover[];
}

/** The two "Students to watch" columns — a closed set, never a free string. */
export type ProgressWatchVariant = 'most_improved' | 'needs_attention';

export interface ProgressWatchListProps {
  variant: ProgressWatchVariant;
  movers: readonly ProgressMover[];
}

export interface ProgressMoverRowProps {
  mover: ProgressMover;
}
