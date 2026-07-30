'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import type { SchoolMe, SchoolMeResponse } from '@/modules/school-admin/types/school-admin.types';

// C-SCH-01: the controller scopes the read to the caller's own school relation
// and answers 403 to every non-school-staff role, so no client-side filter.
async function fetchMySchool(): Promise<SchoolMe> {
  const res = await strapi.get<SchoolMeResponse>('/api/schools/me');
  return res.data.data;
}

export function useMySchoolQuery(enabled: boolean) {
  return useQuery({
    queryKey: ['school-admin', 'me'],
    queryFn: fetchMySchool,
    enabled,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}
