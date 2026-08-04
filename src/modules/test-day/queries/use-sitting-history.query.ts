'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi, type StrapiCollectionResponse } from '@/lib/axios/strapi';
import { sittingHistoryRowSchema } from '@/modules/test-day/schemas/test-day.schema';
import type { SittingHistoryRow } from '@/modules/test-day/types/sitting-history.types';

export const SITTING_HISTORY_QUERY_KEY = ['test-day', 'sitting-history'] as const;

// C-SIT-07 (task 131): per-class sitting history via the summary mode of the
// teacher-scoped sitting list. The server orders newest first and forces the
// owning-teacher filter, so the hook passes the class documentId straight
// through.
async function fetchSittingHistory(classDocumentId: string): Promise<SittingHistoryRow[]> {
  const res = await strapi.get<StrapiCollectionResponse<unknown>>('/api/sittings', {
    params: {
      class: classDocumentId,
      summary: 'true',
    },
  });
  return res.data.data.map((row) => sittingHistoryRowSchema.parse(row));
}

export function useSittingHistoryQuery(classDocumentId: string) {
  return useQuery({
    queryKey: [...SITTING_HISTORY_QUERY_KEY, classDocumentId],
    queryFn: () => fetchSittingHistory(classDocumentId),
    enabled: Boolean(classDocumentId),
  });
}
