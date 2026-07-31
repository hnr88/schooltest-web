'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi, type StrapiSingleResponse } from '@/lib/axios/strapi';
import { schoolParticipationSchema } from '@/modules/school-admin/schemas/participation.schema';
import type { SchoolParticipation } from '@/modules/school-admin/types/participation.types';

export const PARTICIPATION_QUERY_KEY = ['school-admin', 'participation'] as const;

// C-RPT-04 (task 78, mvp spec 4.3): the school-wide participation monitor -
// completion status only, school-scoped server-side (school_admin | ops).
// A short staleTime keeps the chasing screen honest while sittings run.
async function fetchParticipation(): Promise<SchoolParticipation> {
  const res = await strapi.get<StrapiSingleResponse<unknown>>('/api/schools/me/participation');
  return schoolParticipationSchema.parse(res.data.data);
}

export function useParticipationQuery(enabled: boolean) {
  return useQuery({
    queryKey: PARTICIPATION_QUERY_KEY,
    queryFn: fetchParticipation,
    enabled,
    retry: false,
    staleTime: 30 * 1000,
  });
}
