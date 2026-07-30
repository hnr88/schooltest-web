'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import type { OpsSchool, OpsSchoolsResponse } from '@/modules/ops/types/ops.types';

// C-OPS-01: the route is ops-only (global::is-ops + the ops grant), so a
// wrong-role token answers 403 and no client-side filter is needed.
async function fetchOpsSchools(): Promise<OpsSchool[]> {
  const res = await strapi.get<OpsSchoolsResponse>('/api/ops/schools');
  return res.data.data;
}

export function useOpsSchoolsQuery(enabled: boolean) {
  return useQuery({
    queryKey: ['ops', 'schools'],
    queryFn: fetchOpsSchools,
    enabled,
    retry: false,
    staleTime: 60 * 1000,
  });
}
