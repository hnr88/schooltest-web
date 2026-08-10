'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { teacherTestSessionsResponseSchema } from '@/modules/teacher/schemas/teacher-session.schema';
import type { TeacherTestSessionsResponse } from '@/modules/teacher/types/teacher-session.types';

// C-TS-2: GET /api/teacher/test-sessions answers a BARE object carrying active
// AND past sittings, already sorted `opened_at:desc` and already scoped to the
// caller. The portal neither sorts nor filters that list.
async function fetchTestSessions(): Promise<TeacherTestSessionsResponse> {
  const response = await strapi.get('/api/teacher/test-sessions');
  return teacherTestSessionsResponseSchema.parse(response.data);
}

export function useTestSessionsQuery(enabled = true) {
  return useQuery({
    queryKey: ['teacher', 'test-sessions'],
    queryFn: fetchTestSessions,
    enabled,
    staleTime: 0,
    retry: false,
  });
}
