import type { SittingStudentState } from '../types/test-day.types';

// Test-day constants (task 64). The poll cadence is the "live" in the live
// monitor: about 5 s while the sitting is open, stopped once it closes.
export const MONITOR_REFETCH_INTERVAL_MS = 5000;

// C-SIT-03 re-sit only makes sense for a student with an in-flight or stuck
// attempt; not_joined has nothing to terminate and submitted is done.
export const RESITTABLE_STATES: readonly SittingStudentState[] = [
  'joined',
  'in_progress',
  'stalled',
];
