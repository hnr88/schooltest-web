import { CircleCheckBig, Info, TimerReset } from 'lucide-react';

import type {
  ChildProgressMetrics,
  CompletionInsight,
} from '@/modules/children/types/children.types';

export function getCompletionPercent(metrics: ChildProgressMetrics): number | null {
  if (metrics.totalSessions === 0) return null;

  return Math.min(100, Math.round((metrics.completedSessions / metrics.totalSessions) * 100));
}

// Which callout the learning panel shows: nothing started yet, everything done,
// or work in flight. Tone + icon travel with the message so the panel stays dumb.
export function getCompletionInsight(metrics: ChildProgressMetrics): CompletionInsight {
  if (metrics.totalSessions === 0) {
    return { tone: 'info', icon: TimerReset, messageKey: 'noSessionProgress' };
  }
  if (metrics.completedSessions >= metrics.totalSessions) {
    return { tone: 'success', icon: CircleCheckBig, messageKey: 'completionDescription' };
  }
  return { tone: 'info', icon: Info, messageKey: 'completionDescription' };
}
