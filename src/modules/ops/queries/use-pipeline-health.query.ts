'use client';

import { useQuery } from '@tanstack/react-query';
import { pipelineHealthSchema, type PipelineHealth } from '@schooltest/ops-contracts';

import { parseDataEnvelope, strapi } from '@/lib/axios/strapi';
import { PIPELINE_HEALTH_QUERY_KEY } from '@/modules/ops/constants/queries.constants';

/**
 * Ledger row 5d — C-OPS-03 GET /api/ops/pipeline/health, ops only.
 *
 * BullMQ job counts for every registered queue plus the R scoring probe,
 * parsed through the shared schema. The panel is the operator's view of the
 * SAME queues the live workers consume — health only, controls are separate
 * and confirmed.
 */
async function fetchPipelineHealth(signal: AbortSignal): Promise<PipelineHealth> {
  const res = await strapi.get<unknown>('/api/ops/pipeline/health', {
    opsPortalVersioned: true,
    signal,
  });
  return parseDataEnvelope(pipelineHealthSchema, res.data);
}

export function usePipelineHealthQuery(enabled = true) {
  return useQuery({
    queryKey: PIPELINE_HEALTH_QUERY_KEY,
    queryFn: ({ signal }) => fetchPipelineHealth(signal),
    enabled,
    retry: false,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}
