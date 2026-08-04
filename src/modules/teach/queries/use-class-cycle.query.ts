'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi, type StrapiSingleResponse } from '@/lib/axios/strapi';
import { classCycleSchema } from '@/modules/teach/schemas/cycle.schema';
import type { ClassCycle } from '@/modules/teach/types/cycle.types';
import { CLASS_CYCLE_QUERY_KEY } from '@/modules/teach/constants/queries.constants';

// C-TEACH-02 class cycle (task 108): the server enforces the role gate
// (teacher-own | school_admin | ops) and the object scope (a non-owning
// teacher 404s), so the banner renders whatever the caller is entitled to
// and stays quiet on error - the rest of the class page keeps working.
async function fetchClassCycle(classDocumentId: string): Promise<ClassCycle> {
  const res = await strapi.get<StrapiSingleResponse<unknown>>(
    `/api/schools/me/classes/${classDocumentId}/cycle`
  );
  return classCycleSchema.parse(res.data.data);
}

export function useClassCycleQuery(classDocumentId: string) {
  return useQuery({
    queryKey: [...CLASS_CYCLE_QUERY_KEY, classDocumentId],
    queryFn: () => fetchClassCycle(classDocumentId),
  });
}
