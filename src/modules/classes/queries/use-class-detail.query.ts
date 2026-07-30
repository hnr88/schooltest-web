'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi, type StrapiCollectionResponse } from '@/lib/axios/strapi';
import { schoolClassSchema } from '@/modules/classes/schemas/class.schema';
import type { SchoolClass } from '@/modules/classes/types/classes.types';

export const CLASS_DETAIL_QUERY_KEY = ['classes', 'school', 'detail'] as const;

// C-CLS-01 has no single-class read, so the detail is the caller's class list
// filtered by documentId; null when the class is not in the caller's school.
// The key nests under CLASSES_QUERY_KEY, so the mutations' prefix
// invalidation refreshes the detail after every save.
async function fetchClassDetail(documentId: string): Promise<SchoolClass | null> {
  const res = await strapi.get<StrapiCollectionResponse<unknown>>('/api/schools/me/classes');
  const rows = res.data.data.map((row) => schoolClassSchema.parse(row));
  return rows.find((row) => row.documentId === documentId) ?? null;
}

export function useClassDetailQuery(documentId: string, enabled: boolean) {
  return useQuery({
    queryKey: [...CLASS_DETAIL_QUERY_KEY, documentId],
    queryFn: () => fetchClassDetail(documentId),
    enabled,
  });
}
