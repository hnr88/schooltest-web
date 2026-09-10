import type { PillTone } from '@/modules/test-day/types/components.types';
import type { MonitorRowState, SittingStudentState } from '@/modules/test-day/types/test-day.types';

export const STATE_TONES: Record<SittingStudentState, PillTone> = {
  not_joined: 'neutral',
  joined: 'info',
  in_progress: 'warning',
  submitted: 'success',
  stalled: 'danger',
  // teacher/12 — scoring_failed keeps the operator's danger; Paused shares
  // Stalled's chip entirely (the design's chipFor groups them); Absent is the
  // quiet neutral grey, nothing to act on.
  scoring_failed: 'danger',
  paused: 'danger',
  absent: 'neutral',
};

export const STATE_ORDER: readonly MonitorRowState[] = [
  'not_joined',
  'code_shown',
  'joined',
  'in_progress',
  'submitted',
  'stalled',
  'scoring_failed',
  'absent',
  'paused',
];

export const LINK_CLASSES =
  'w-fit text-sm font-semibold text-primary transition-colors duration-150 hover:text-primary/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

export const OPENED_AT_PATTERN = 'd MMM yyyy';

export const SUMMARY_COUNTS = [
  { key: 'sat', field: 'sat' },
  { key: 'absent', field: 'absent' },
  { key: 'needsResit', field: 'needs_resit' },
  { key: 'resultsPending', field: 'results_pending' },
  { key: 'resultsReady', field: 'results_ready' },
] as const;
