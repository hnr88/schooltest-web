import type { ChildProgressMetrics } from '@/modules/children/types/children.types';

export function getCompletionPercent(metrics: ChildProgressMetrics): number | null {
  if (metrics.totalSessions === 0) return null;

  return Math.min(100, Math.round((metrics.completedSessions / metrics.totalSessions) * 100));
}
