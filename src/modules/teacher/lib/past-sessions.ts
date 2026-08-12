import { completionPercent } from '@/modules/teacher/lib/dashboard-cards';
import type {
  PastSessionsReadCounts,
  PastSessionsStatus,
} from '@/modules/teacher/types/past-sessions.types';
import type { TeacherTestSession } from '@/modules/teacher/types/teacher-session.types';

/**
 * Error beats pending beats emptiness — the same order the dashboard cards use.
 * `empty` is reported only once C-TS-2 actually answered, so "you have not run a
 * session yet" can never be a loading frame or a swallowed failure.
 */
export function derivePastSessionsStatus(counts: PastSessionsReadCounts): PastSessionsStatus {
  if (counts.isError) return 'error';
  if (counts.isLoading || !counts.isSuccess) return 'loading';
  if (counts.sessionCount === 0) return 'empty';
  return 'ready';
}

/**
 * The ONLY arithmetic a history row does. C-TS-2 sends `completed`/`expected`
 * already derived server-side; the row prints that pair verbatim and this turns
 * it into the 0..100 the track needs. A sitting whose class roster is empty
 * reports 0% rather than NaN (`completionPercent` owns that guard).
 */
export function sessionCompletionPercent(session: TeacherTestSession): number {
  return completionPercent({ completed: session.completed, total: session.expected });
}
