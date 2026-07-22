import type { ChildProgressMetrics } from '@/modules/children/types/children.types';

// The four counted facts the parent progress contract returns, in canonical
// reading order. No icon tiles: the canonical COMPACT stat tile (Parent overview
// child card) is a 22px value over a 12.5px label on the page-tint surface at
// 14px padding — nothing else, and nothing stretched to a neighbour's height.
export const CHILD_METRICS = [
  { key: 'totalSessions', labelKey: 'metricTotalSessions' },
  { key: 'completedSessions', labelKey: 'metricCompletedSessions' },
  { key: 'activeSessions', labelKey: 'metricActiveSessions' },
  { key: 'officialResults', labelKey: 'metricOfficialResults' },
] as const satisfies readonly {
  key: keyof ChildProgressMetrics;
  labelKey: string;
}[];
