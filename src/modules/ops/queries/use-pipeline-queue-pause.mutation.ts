'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  RestContractViolation,
  pipelineQueuePauseRequestSchema,
  pipelineQueuePauseResponseSchema,
} from '@schooltest/ops-contracts';

import { strapi } from '@/lib/axios/strapi';
import { PIPELINE_HEALTH_QUERY_KEY } from '@/modules/ops/constants/queries.constants';

/**
 * Ledger row 5d — C-OPSY-09 POST /api/ops/pipeline/queues/:name/pause.
 *
 * Pauses (or resumes) ONE registered BullMQ queue. This is disruptive to the
 * live workers that share the queue, so the UI gates it behind a destructive
 * confirmation naming the queue; the server validates the name against the
 * registered allowlist.
 */
async function pausePipelineQueue(input: pipelineQueuePauseRequestSchema_input & { name: string }) {
  const { name, ...body } = input;
  const parsedInput = pipelineQueuePauseRequestSchema.safeParse(body);
  if (!parsedInput.success) throw new RestContractViolation(parsedInput.error.issues);
  const res = await strapi.post<unknown>(
    `/api/ops/pipeline/queues/${encodeURIComponent(name)}/pause`,
    parsedInput.data,
  );
  const parsed = pipelineQueuePauseResponseSchema.safeParse(res.data);
  if (!parsed.success) throw new RestContractViolation(parsed.error.issues);
  return parsed.data.data;
}

type pipelineQueuePauseRequestSchema_input = {
  paused: boolean;
};

export function usePipelineQueuePauseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: pausePipelineQueue,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PIPELINE_HEALTH_QUERY_KEY });
    },
  });
}
