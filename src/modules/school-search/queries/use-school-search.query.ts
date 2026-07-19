'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { schoolSearchResponseSchema } from '@/modules/school-search/schemas/school-search.schema';
import type {
  SchoolSearchRequest,
  SchoolSearchResult,
} from '@/modules/school-search/types/school-search.types';

async function fetchSchoolSearch(
  request: SchoolSearchRequest
): Promise<SchoolSearchResult> {
  const res = await strapi.post<unknown>('/api/search/schools', request);
  return schoolSearchResponseSchema.parse(res.data);
}

export function useSchoolSearchQuery(request: SchoolSearchRequest) {
  return useQuery({
    queryKey: ['school-search', request],
    queryFn: () => fetchSchoolSearch(request),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
