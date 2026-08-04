'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { MONITOR_REFETCH_INTERVAL_MS } from '@/modules/test-day/constants/test-day.constants';
import { sittingSummarySchema } from '@/modules/test-day/schemas/test-day.schema';
import type { SittingSummary } from '@/modules/test-day/types/sitting-summary.types';
import { SITTING_SUMMARY_QUERY_KEY } from '@/modules/test-day/constants/queries.constants';

// C-SIT-08 (task 136): the owning teacher's end-of-test-day rollup. A foreign
// sitting 404s (object rule), which the panel renders as its error state.
async function fetchSittingSummary(sittingDocumentId: string): Promise<SittingSummary> {
  const res = await strapi.get<{ data: unknown }>(`/api/sittings/${sittingDocumentId}/summary`);
  return sittingSummarySchema.parse(res.data.data);
}

export function useSittingSummaryQuery(sittingDocumentId: string | null) {
  return useQuery({
    queryKey: [...SITTING_SUMMARY_QUERY_KEY, sittingDocumentId],
    queryFn: () => fetchSittingSummary(sittingDocumentId as string),
    enabled: sittingDocumentId !== null,
    // Same poll idiom as the monitor: live while open, a closed sitting keeps
    // its final rollup.
    refetchInterval: (query) =>
      query.state.data?.sitting.status === 'closed' ? false : MONITOR_REFETCH_INTERVAL_MS,
  });
}
