import type { PillTone } from '@/modules/test-day/types/components.types';
import type { MonitorRowState, SittingStudentState } from '@/modules/test-day/types/test-day.types';

export const STATE_TONES: Record<SittingStudentState, PillTone> = {
  not_joined: 'neutral',
  joined: 'info',
  in_progress: 'warning',
  submitted: 'success',
  stalled: 'danger',
};

export const STATE_ORDER: readonly MonitorRowState[] = [
  'not_joined',
  'code_shown',
  'joined',
  'in_progress',
  'submitted',
  'stalled',
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
