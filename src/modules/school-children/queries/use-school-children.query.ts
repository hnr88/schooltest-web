'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { schoolChildrenResponseSchema } from '@/modules/school-children/schemas/school-child.schema';
import type {
  SchoolChildrenPage,
  SchoolChildrenQuery,
} from '@/modules/school-children/types/school-children.types';

export const SCHOOL_CHILDREN_QUERY_KEY = ['school-children'] as const;
export const SCHOOL_CHILDREN_PAGE_SIZE = 25;

// C-CHD-01: children of the caller's school. The filter state maps 1:1 onto
// the contract query params — 'all' simply omits the param. keepPreviousData
// holds the last page while a filter/page change refetches, so the table
// never flashes empty.
async function fetchSchoolChildren(query: SchoolChildrenQuery): Promise<SchoolChildrenPage> {
  const res = await strapi.get<unknown>('/api/schools/me/children', {
    params: {
      page: query.page,
      pageSize: SCHOOL_CHILDREN_PAGE_SIZE,
      ...(query.status !== 'all' ? { status: query.status } : {}),
      ...(query.classId !== 'all' ? { class: query.classId } : {}),
      ...(query.q !== '' ? { q: query.q } : {}),
    },
  });
  const parsed = schoolChildrenResponseSchema.parse(res.data);
  return { rows: parsed.data, pagination: parsed.meta.pagination };
}

export function useSchoolChildrenQuery(query: SchoolChildrenQuery, enabled: boolean) {
  return useQuery({
    queryKey: [...SCHOOL_CHILDREN_QUERY_KEY, query],
    queryFn: () => fetchSchoolChildren(query),
    enabled,
    placeholderData: keepPreviousData,
  });
}
