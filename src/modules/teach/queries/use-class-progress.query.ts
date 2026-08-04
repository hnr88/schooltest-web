'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi, type StrapiSingleResponse } from '@/lib/axios/strapi';
import { classProgressSchema } from '@/modules/teach/schemas/progress.schema';
import type { ClassProgress } from '@/modules/teach/types/progress.types';
import { CLASS_PROGRESS_QUERY_KEY } from '@/modules/teach/constants/queries.constants';

// C-RPT-02 school-scoped class progress (task 76): the server enforces the
// role gate (teacher | school_admin | ops) and the object scope (teacher must
// sit in the class's teachers), so an unowned class 403s here and the panel
// renders its error state rather than leaking another teacher's class.
async function fetchClassProgress(classDocumentId: string): Promise<ClassProgress> {
  const res = await strapi.get<StrapiSingleResponse<unknown>>(
    `/api/schools/me/classes/${classDocumentId}/progress`
  );
  return classProgressSchema.parse(res.data.data);
}

export function useClassProgressQuery(classDocumentId: string) {
  return useQuery({
    queryKey: [...CLASS_PROGRESS_QUERY_KEY, classDocumentId],
    queryFn: () => fetchClassProgress(classDocumentId),
  });
}
