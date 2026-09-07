'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  RestContractViolation,
  pipelineRetryRequestSchema,
  pipelineRetryResponseSchema,
} from '@schooltest/ops-contracts';

import { strapi } from '@/lib/axios/strapi';
import { PIPELINE_HEALTH_QUERY_KEY } from '@/modules/ops/constants/queries.constants';

/**
 * Ledger row 5d — C-OPS-03 POST /api/ops/pipeline/retry.
 *
 * Re-runs ONE failed job through BullMQ's own retry — it does not rebuild the
 * queue or replay data. The server 404s an unknown job, so a typo'd id is an
 * honest error, never a silent no-op.
 */
async function retryPipelineJob(input: pipelineRetryRequestSchema_input) {
  const parsedInput = pipelineRetryRequestSchema.safeParse(input);
  if (!parsedInput.success) throw new RestContractViolation(parsedInput.error.issues);
  const res = await strapi.post<unknown>('/api/ops/pipeline/retry', parsedInput.data);
  const parsed = pipelineRetryResponseSchema.safeParse(res.data);
  if (!parsed.success) throw new RestContractViolation(parsed.error.issues);
  return parsed.data.data;
}

type pipelineRetryRequestSchema_input = {
  queue: string;
  job_id: string;
};

export function usePipelineRetryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: retryPipelineJob,
    // A retried job leaves `failed` and may go back to waiting/active — the
    // health table on the same screen must refetch.
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PIPELINE_HEALTH_QUERY_KEY });
    },
  });
}
