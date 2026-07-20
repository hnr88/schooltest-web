import { Activity, ClipboardCheck, FileCheck2, ListChecks } from 'lucide-react';

import type { StatCardIconTone } from '@/modules/design-system';
import type { ChildProgressMetrics } from '@/modules/children/types/children.types';

export const CHILD_METRICS = [
  { key: 'totalSessions', labelKey: 'metricTotalSessions', icon: ListChecks, iconTone: 'blue' },
  {
    key: 'completedSessions',
    labelKey: 'metricCompletedSessions',
    icon: ClipboardCheck,
    iconTone: 'teal',
  },
  { key: 'activeSessions', labelKey: 'metricActiveSessions', icon: Activity, iconTone: 'navy' },
  { key: 'officialResults', labelKey: 'metricOfficialResults', icon: FileCheck2, iconTone: 'teal' },
] as const satisfies readonly {
  key: keyof ChildProgressMetrics;
  labelKey: string;
  icon: typeof Activity;
  iconTone: StatCardIconTone;
}[];
