import type { ChildProgressMetrics } from '@/modules/children/types/children.types';

// null, not 0, when the API reported no sessions: the hero drops the completion
// line entirely rather than drawing an empty track over "0/0", because "started
// and got nowhere" and "never started" are different facts.
export function getCompletionPercent(metrics: ChildProgressMetrics): number | null {
  if (metrics.totalSessions === 0) return null;

  return Math.min(100, Math.round((metrics.completedSessions / metrics.totalSessions) * 100));
}
