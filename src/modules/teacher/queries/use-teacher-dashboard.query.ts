'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { teacherDashboardResponseSchema } from '@/modules/teacher/schemas/teacher.schema';
import type { TeacherDashboardResponse } from '@/modules/teacher/types/teacher.types';

// C-TD-1: GET /api/teacher/dashboard answers a BARE object (no {data, meta}).
// Scoping is the server's job — every /api/teacher/** route is scoped to
// `class.teacher = caller` — so the portal never filters and never retries a
// 401/403: those statuses are the answer, not a transient failure.
async function fetchTeacherDashboard(): Promise<TeacherDashboardResponse> {
  const response = await strapi.get('/api/teacher/dashboard');
  return teacherDashboardResponseSchema.parse(response.data);
}

export function useTeacherDashboardQuery(enabled = true) {
  return useQuery({
    queryKey: ['teacher', 'dashboard'],
    queryFn: fetchTeacherDashboard,
    enabled,
    staleTime: 0,
    retry: false,
  });
}
