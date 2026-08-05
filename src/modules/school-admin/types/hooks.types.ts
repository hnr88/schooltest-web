import type { SchoolClass } from '@/modules/classes';
import type { SchoolMe } from '@/modules/school-admin/types/school-admin.types';

export interface AreaAggregate {
  code: string;
  mastered: number;
  emerging: number;
  not_mastered: number;
  not_assessed: number;
}

export interface SchoolAggregate {
  rosterTotal: number;
  satTotal: number;
  areas: AreaAggregate[];
  isPending: boolean;
  isError: boolean;
}

// Everything the read-only School analytics home renders, gathered from
// C-SCH-01, C-ENT-01, C-RPT-04 and C-CLS-01 in one pass.
export interface SchoolAnalyticsData {
  school: SchoolMe;
  classes: SchoolClass[];
  studentsTested: number;
  readingTestsCompleted: number;
  readingTestsAllowed: number;
  isTrial: boolean;
}

export interface SchoolAnalytics {
  isPending: boolean;
  isError: boolean;
  isFetching: boolean;
  refetch: () => void;
  data: SchoolAnalyticsData | null;
}
