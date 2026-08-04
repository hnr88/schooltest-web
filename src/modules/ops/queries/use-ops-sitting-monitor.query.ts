'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import {
  recoveryMonitorSchema,
  type RecoveryMonitor,
} from '@/modules/ops/schemas/recovery.schema';
import { OPS_SITTING_MONITOR_QUERY_KEY } from '@/modules/ops/constants/queries.constants';

// C-SIT-02 (task 60) monitor read, reused ops-side (task 69): ops is allowed
// alongside the owning teacher, so the recovery panel lists the roster with
// live states through the existing route - no new GET.
async function fetchSittingMonitor(sittingDocumentId: string): Promise<RecoveryMonitor> {
  const res = await strapi.get<{ data: unknown }>(`/api/sittings/${sittingDocumentId}/monitor`);
  return recoveryMonitorSchema.parse(res.data.data);
}

export function useOpsSittingMonitorQuery(sittingDocumentId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: [...OPS_SITTING_MONITOR_QUERY_KEY, sittingDocumentId],
    queryFn: () => fetchSittingMonitor(sittingDocumentId as string),
    enabled: enabled && Boolean(sittingDocumentId),
    retry: false,
    staleTime: 15 * 1000,
  });
}
