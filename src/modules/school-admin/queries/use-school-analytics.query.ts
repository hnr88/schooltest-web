'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { SCHOOL_ANALYTICS_QUERY_KEY } from '@/modules/school-admin/constants/queries.constants';
import type {
  SchoolAnalyticsSummary,
  SchoolAnalyticsSummaryResponse,
} from '@/modules/school-admin/types/school-admin.types';

// C-RPT-06 (GET /api/schools/me/analytics): the spec section 1 home figures and
// the spec section 5 Account seat pair, every one of them derived from live
// data at read. The seat pair is students_with_sitting / students_total — NOT
// the entitlement's licensing seats_used / seats_total, which C-ENT-01 still
// owns and enforces. A short staleTime keeps both surfaces honest while
// sittings run.
async function fetchSchoolAnalytics(): Promise<SchoolAnalyticsSummary> {
  const res = await strapi.get<SchoolAnalyticsSummaryResponse>('/api/schools/me/analytics');
  return res.data.data;
}

export function useSchoolAnalyticsQuery(enabled: boolean) {
  return useQuery({
    queryKey: SCHOOL_ANALYTICS_QUERY_KEY,
    queryFn: fetchSchoolAnalytics,
    enabled,
    retry: false,
    staleTime: 60 * 1000,
  });
}
