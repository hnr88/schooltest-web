'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import {
  teacherTestSessionsQuerySchema,
  teacherTestSessionsResponseSchema,
  type TeacherTestSessionsQuery,
} from '@/modules/teacher/schemas/teacher-session.schema';
import type { TeacherTestSessionsResponse } from '@/modules/teacher/types/teacher-session.types';

// C-TS-2: GET /api/teacher/test-sessions answers a BARE object carrying active
// AND past sittings, already sorted `opened_at:desc` and already scoped to the
// caller. `params` are the server's own filters and paging (`status`, `class`,
// `page`, `pageSize` → `meta.pagination`); without them the answer is every
// row, and the query key stays the one every existing reader shares.
async function fetchTestSessions(
  params: TeacherTestSessionsQuery,
): Promise<TeacherTestSessionsResponse> {
  const response = await strapi.get('/api/teacher/test-sessions', {
    params: teacherTestSessionsQuerySchema.parse(params),
  });
  return teacherTestSessionsResponseSchema.parse(response.data);
}

export function useTestSessionsQuery(enabled = true, params: TeacherTestSessionsQuery = {}) {
  const hasParams = Object.values(params).some((value) => value !== undefined);
  return useQuery({
    queryKey: hasParams ? ['teacher', 'test-sessions', params] : ['teacher', 'test-sessions'],
    queryFn: () => fetchTestSessions(params),
    enabled,
    staleTime: 0,
    retry: false,
  });
}
