'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { teacherNeedsAttentionQueryKey } from '@/modules/teachers/constants/queries.constants';
import { teacherNeedsAttentionSchema } from '@/modules/teachers/schemas/teachers.schema';
import type { TeacherNeedsAttention } from '@/modules/teachers/types/teachers.types';

// GAP-01 (tasks 018/019): the school-admin needs-attention read. The rows are
// the C-TR-4 criterion the backend computes per class of that teacher —
// students with numeric scores on BOTH tests and a negative delta, worst
// first — merged server-side. `students: []` is therefore a MEASURED fact
// about the comparable cohort (nobody regressed, or nobody has both tests),
// never an error and never filled with next-best students.
async function fetchTeacherNeedsAttention(documentId: string): Promise<TeacherNeedsAttention> {
  const res = await strapi.get<{ data: unknown }>(
    `/api/schools/me/teachers/${documentId}/needs-attention`,
  );
  return teacherNeedsAttentionSchema.parse(res.data.data);
}

export function useTeacherNeedsAttentionQuery(documentId: string, enabled: boolean) {
  return useQuery({
    queryKey: teacherNeedsAttentionQueryKey(documentId),
    queryFn: () => fetchTeacherNeedsAttention(documentId),
    enabled,
  });
}
