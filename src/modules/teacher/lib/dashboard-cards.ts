import type {
  TeacherDashboardCounts,
  TeacherDashboardStatus,
} from '@/modules/teacher/types/teacher-dashboard.types';
import type { TestCompletion } from '@/modules/teacher/types/teacher.types';

/**
 * The ONLY arithmetic a class card does. `completed` and `total` are both
 * server-derived (C-TD-1); this turns the pair into the 0..100 the progress
 * track needs and nothing else. An empty roster would divide by zero, so it
 * reports 0% — the honest reading of "none of nobody has finished", never NaN
 * and never a filler bar.
 */
export function completionPercent({ completed, total }: TestCompletion): number {
  if (total <= 0) return 0;
  return Math.round((completed / total) * 100);
}

/**
 * Error beats pending beats emptiness: `empty` is only ever reported once the
 * read actually came back, so "no classes are assigned to you" can never be a
 * loading frame or a swallowed failure wearing an empty state.
 */
export function deriveDashboardStatus(counts: TeacherDashboardCounts): TeacherDashboardStatus {
  if (counts.isError) return 'error';
  if (counts.isLoading || !counts.isSuccess) return 'loading';
  if (counts.classCount === 0) return 'empty';
  return 'ready';
}
