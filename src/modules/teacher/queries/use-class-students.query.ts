'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { classStudentsResponseSchema } from '@/modules/teacher/schemas/teacher-result.schema';
import type { ClassStudentsResponse } from '@/modules/teacher/types/teacher-result.types';

// C-TR-1: GET /api/teacher/classes/:documentId/students answers a BARE object.
// `avg_score` and every per-cell `score` are the A1 derivation applied
// server-side (`src/utils/teacher-score.ts`); the portal averages nothing.
async function fetchClassStudents(documentId: string): Promise<ClassStudentsResponse> {
  const response = await strapi.get(`/api/teacher/classes/${documentId}/students`);
  return classStudentsResponseSchema.parse(response.data);
}

export function useClassStudentsQuery(documentId: string, enabled = true) {
  return useQuery({
    queryKey: ['teacher', 'class-students', documentId],
    queryFn: () => fetchClassStudents(documentId),
    enabled: enabled && Boolean(documentId),
    staleTime: 0,
    retry: false,
  });
}
