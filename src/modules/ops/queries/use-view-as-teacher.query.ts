'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import {
  viewAsTeacherSchema,
  type ViewAsTeacher,
} from '@/modules/ops/schemas/surfaces.schema';
import { VIEW_AS_TEACHER_QUERY_KEY } from '@/modules/ops/constants/queries.constants';

// C-OPS-04 (task 70): the audited view-as-teacher read. Every call writes an
// audit row server-side; the route is ops-only, so a wrong-role token answers
// 403 and a non-teacher or unknown documentId answers 404.
async function fetchViewAsTeacher(documentId: string): Promise<ViewAsTeacher> {
  const res = await strapi.get<{ data: unknown }>(`/api/ops/view-as-teacher/${documentId}`);
  return viewAsTeacherSchema.parse(res.data.data);
}

export function useViewAsTeacherQuery(documentId: string, enabled: boolean) {
  return useQuery({
    queryKey: [...VIEW_AS_TEACHER_QUERY_KEY, documentId],
    queryFn: () => fetchViewAsTeacher(documentId),
    enabled: enabled && documentId !== '',
    retry: false,
    staleTime: 30 * 1000,
  });
}
