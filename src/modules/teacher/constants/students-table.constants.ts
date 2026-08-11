import type { StatusPillTone } from '@/modules/design-system';
import type { TestProgressState } from '@/modules/teacher/types/teacher.types';

// NO CUT AND NO STATE DERIVATION LIVES HERE, DELIBERATELY — the same discipline
// `src/modules/report/constants/mastery.constants.ts` and this module's own
// `mastery.constants.ts` carry.
//
// `state` is C-TR-1's OWN word per test cell ('done' | 'stalled' | 'in_progress'
// | 'not_started'), derived server-side from real session/result rows; `score` is
// the A1 derivation (`src/utils/teacher-score.ts`) and `acara_phase` the
// platform's persisted label. This table colours a pill from the wire `state`,
// prints the wire `score` verbatim and re-derives nothing: it never compares a
// score to 80 or 50, and never infers a state from a score.
export const TEST_STATE_TONE: Record<TestProgressState, StatusPillTone> = {
  done: 'success',
  stalled: 'warning',
  in_progress: 'info',
  not_started: 'neutral',
};

// WCAG 2.2 AA 1.4.1: the tone above is NEVER the only carrier of the state — the
// pill always prints the state's own word, from these keys under
// `Teacher.results.students`.
export const TEST_STATE_LABEL_KEY: Record<TestProgressState, string> = {
  done: 'stateDone',
  stalled: 'stateStalled',
  in_progress: 'stateInProgress',
  not_started: 'stateNotStarted',
};

/**
 * 56px rows: the whole row is the drill-down target, so it clears the 44x44px
 * minimum (WCAG 2.2 AA 2.5.8) on the short axis too. `relative` is what the row
 * link's full-row overlay positions against.
 */
export const STUDENTS_TABLE_ROW_CLASS =
  'relative h-14 border-border transition-colors duration-200 ease-out hover:bg-surface-inset focus-within:bg-surface-inset motion-reduce:transition-none';

/** The first column of each test group carries the group's left divider. */
export const STUDENTS_TABLE_GROUP_EDGE_CLASS = 'border-l border-border';
