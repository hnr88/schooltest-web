'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { teacherTestsResponseSchema } from '@/modules/teacher/schemas/teacher.schema';
import type { TeacherTestsResponse } from '@/modules/teacher/types/teacher.types';

// C-TD-2: GET /api/teacher/tests answers a BARE object. The selectable A/B pair
// is whatever the server lists — the portal never composes a form code and
// never composes the `label`, which arrives ready to render.
async function fetchTeacherTests(): Promise<TeacherTestsResponse> {
  const response = await strapi.get('/api/teacher/tests');
  return teacherTestsResponseSchema.parse(response.data);
}

export function useTeacherTestsQuery(enabled = true) {
  return useQuery({
    queryKey: ['teacher', 'tests'],
    queryFn: fetchTeacherTests,
    enabled,
    staleTime: 0,
    retry: false,
  });
}
