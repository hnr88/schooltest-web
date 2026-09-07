'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  RestContractViolation,
  pipelineQueueDrainResponseSchema,
} from '@schooltest/ops-contracts';

import { strapi } from '@/lib/axios/strapi';
import { PIPELINE_HEALTH_QUERY_KEY } from '@/modules/ops/constants/queries.constants';

/**
 * Ledger row 5d — C-OPSY-08 POST /api/ops/pipeline/queues/:name/drain.
 *
 * Deletes FAILED jobs only (draining waiting work would silently discard real
 * jobs). The server returns how many it actually removed; the UI shows that
 * number. Disruptive enough to gate behind a destructive confirmation that
 * names the queue and its current failed depth.
 */
async function drainPipelineQueue(name: string) {
  const res = await strapi.post<unknown>(
    `/api/ops/pipeline/queues/${encodeURIComponent(name)}/drain`,
    {},
  );
  const parsed = pipelineQueueDrainResponseSchema.safeParse(res.data);
  if (!parsed.success) throw new RestContractViolation(parsed.error.issues);
  return parsed.data.data;
}

export function usePipelineQueueDrainMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: drainPipelineQueue,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PIPELINE_HEALTH_QUERY_KEY });
    },
  });
}
