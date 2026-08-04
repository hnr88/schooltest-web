'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi, type StrapiCollectionResponse } from '@/lib/axios/strapi';
import { classSittingSchema } from '@/modules/test-day/schemas/test-day.schema';
import type { ClassSitting } from '@/modules/test-day/types/test-day.types';

export const CLASS_SITTINGS_QUERY_KEY = ['test-day', 'sittings'] as const;

// Teacher-scoped sittings for one class (core GET /api/sittings forces the
// owning-teacher filter server-side, newest first). The screen derives the
// current sitting as the open one, if any.
async function fetchClassSittings(classDocumentId: string): Promise<ClassSitting[]> {
  const res = await strapi.get<StrapiCollectionResponse<unknown>>('/api/sittings', {
    params: {
      'filters[class][documentId][$eq]': classDocumentId,
      sort: 'createdAt:desc',
      'populate[form][fields][0]': 'form_code',
      'populate[class][fields][0]': 'name',
      'pagination[pageSize]': 100,
    },
  });
  return res.data.data.map((row) => classSittingSchema.parse(row));
}

export function useClassSittingsQuery(classDocumentId: string) {
  return useQuery({
    queryKey: [...CLASS_SITTINGS_QUERY_KEY, classDocumentId],
    queryFn: () => fetchClassSittings(classDocumentId),
  });
}
