'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { studentDrillDownResponseSchema } from '@/modules/teacher/schemas/teacher-result.schema';
import type { StudentDrillDownResponse } from '@/modules/teacher/types/teacher-result.types';

// C-TR-2: GET /api/teacher/classes/:documentId/students/:studentDocumentId
// answers a BARE object. `tests` arrives MOST RECENT FIRST and each subskill
// carries its own server-derived `status` + `likelihood` + `delta`. The portal
// re-orders nothing and re-thresholds nothing; `bands` is echoed for display
// only (the legend), never applied.
async function fetchStudentDrillDown(
  documentId: string,
  studentDocumentId: string,
): Promise<StudentDrillDownResponse> {
  const response = await strapi.get(
    `/api/teacher/classes/${documentId}/students/${studentDocumentId}`,
  );
  return studentDrillDownResponseSchema.parse(response.data);
}

export function useStudentDrillDownQuery(
  documentId: string,
  studentDocumentId: string,
  enabled = true,
) {
  return useQuery({
    queryKey: ['teacher', 'student-drill-down', documentId, studentDocumentId],
    queryFn: () => fetchStudentDrillDown(documentId, studentDocumentId),
    enabled: enabled && Boolean(documentId) && Boolean(studentDocumentId),
    staleTime: 0,
    retry: false,
  });
}
