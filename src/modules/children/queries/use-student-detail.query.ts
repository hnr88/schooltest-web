'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { studentDetailResponseSchema } from '@/modules/children/schemas/student-detail.schema';
import type { StudentDetail } from '@/modules/children/types/children.types';

// C-STUDENT-LIST-EXT parent detail read: GET /api/my/students/:documentId —
// ownership forced server-side (foreign/unknown documentId → 404). Feeds the edit
// wizard prefill (the list cache lacks the optional wizard fields). Kept under the
// ['dashboard','students'] prefix so the update mutation's invalidation refreshes
// it too.
async function fetchStudentDetail(documentId: string): Promise<StudentDetail> {
  const res = await strapi.get(`/api/my/students/${documentId}`);
  return studentDetailResponseSchema.parse(res.data).data;
}

export function useStudentDetailQuery(documentId: string) {
  return useQuery({
    queryKey: ['dashboard', 'students', documentId],
    queryFn: () => fetchStudentDetail(documentId),
    enabled: Boolean(documentId),
    staleTime: 0,
    retry: false,
  });
}
