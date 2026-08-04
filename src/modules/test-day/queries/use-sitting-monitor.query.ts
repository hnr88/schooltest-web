'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { MONITOR_REFETCH_INTERVAL_MS } from '@/modules/test-day/constants/test-day.constants';
import { sittingMonitorSchema } from '@/modules/test-day/schemas/test-day.schema';
import type { SittingMonitor } from '@/modules/test-day/types/test-day.types';
import { SITTING_MONITOR_QUERY_KEY } from '@/modules/test-day/constants/queries.constants';

// C-SIT-02: the owning teacher's live board. A foreign sitting 404s (object
// rule), which the screen renders as its error state.
async function fetchSittingMonitor(sittingDocumentId: string): Promise<SittingMonitor> {
  const res = await strapi.get<{ data: unknown }>(`/api/sittings/${sittingDocumentId}/monitor`);
  return sittingMonitorSchema.parse(res.data.data);
}

export function useSittingMonitorQuery(sittingDocumentId: string | null) {
  return useQuery({
    queryKey: [...SITTING_MONITOR_QUERY_KEY, sittingDocumentId],
    queryFn: () => fetchSittingMonitor(sittingDocumentId as string),
    enabled: sittingDocumentId !== null,
    // Live while open; a closed sitting is a static final board.
    refetchInterval: (query) =>
      query.state.data?.sitting.status === 'closed' ? false : MONITOR_REFETCH_INTERVAL_MS,
  });
}
