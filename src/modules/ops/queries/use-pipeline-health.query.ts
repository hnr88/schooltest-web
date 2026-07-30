'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import {
  pipelineHealthSchema,
  type PipelineHealth,
} from '@/modules/ops/schemas/pipeline.schema';

export const PIPELINE_HEALTH_QUERY_KEY = ['ops', 'pipeline-health'] as const;

// C-OPS-03 (task 69): the route is ops-only (global::is-ops + the ops grant).
// The endpoint degrades R to "down" without erroring, so a failed probe never
// lands here as a query error.
async function fetchPipelineHealth(): Promise<PipelineHealth> {
  const res = await strapi.get<{ data: unknown }>('/api/ops/pipeline/health');
  return pipelineHealthSchema.parse(res.data.data);
}

export function usePipelineHealthQuery(enabled: boolean) {
  return useQuery({
    queryKey: PIPELINE_HEALTH_QUERY_KEY,
    queryFn: fetchPipelineHealth,
    enabled,
    retry: false,
    // The panel is the live watch on the scoring pipeline (mvp-updates 4.2).
    refetchInterval: 10_000,
  });
}
