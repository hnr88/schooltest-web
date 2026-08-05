import type { SchoolClass } from '@/modules/classes';
import type {
  SchoolAnalyticsSummary,
  SchoolMe,
} from '@/modules/school-admin/types/school-admin.types';

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

// Everything the read-only School analytics home renders: C-SCH-01 for the
// header, C-CLS-01 for the class list, and C-RPT-06 for every metric card in
// one payload.
export interface SchoolAnalyticsData {
  school: SchoolMe;
  classes: SchoolClass[];
  summary: SchoolAnalyticsSummary;
  isTrial: boolean;
}

export interface SchoolAnalytics {
  isPending: boolean;
  isError: boolean;
  isFetching: boolean;
  refetch: () => void;
  data: SchoolAnalyticsData | null;
}
