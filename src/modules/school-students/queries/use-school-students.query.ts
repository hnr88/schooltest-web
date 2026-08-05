'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { schoolStudentsResponseSchema } from '@/modules/school-students/schemas/school-student.schema';
import type {
  SchoolStudentsPage,
  SchoolStudentsQuery,
} from '@/modules/school-students/types/school-students.types';
import { SCHOOL_CHILDREN_PAGE_SIZE, SCHOOL_CHILDREN_QUERY_KEY } from '@/modules/school-students/constants/queries.constants';

// C-CHD-01: students of the caller's school. The filter state maps 1:1 onto
// the contract query params — 'all' simply omits the param. keepPreviousData
// holds the last page while a filter/page change refetches, so the table
// never flashes empty.
async function fetchSchoolStudents(query: SchoolStudentsQuery): Promise<SchoolStudentsPage> {
  const res = await strapi.get<unknown>('/api/schools/me/children', {
    params: {
      page: query.page,
      pageSize: query.pageSize ?? SCHOOL_CHILDREN_PAGE_SIZE,
      ...(query.status !== 'all' ? { status: query.status } : {}),
      ...(query.classId !== 'all' ? { class: query.classId } : {}),
      ...(query.q !== '' ? { q: query.q } : {}),
    },
  });
  const parsed = schoolStudentsResponseSchema.parse(res.data);
  return { rows: parsed.data, pagination: parsed.meta.pagination };
}

export function useSchoolStudentsQuery(query: SchoolStudentsQuery, enabled: boolean) {
  return useQuery({
    queryKey: [...SCHOOL_CHILDREN_QUERY_KEY, query],
    queryFn: () => fetchSchoolStudents(query),
    enabled,
    placeholderData: keepPreviousData,
  });
}
