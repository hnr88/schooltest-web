'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { pipelineRetryResultSchema } from '@/modules/ops/schemas/pipeline.schema';
import { PIPELINE_HEALTH_QUERY_KEY } from '@/modules/ops/queries/use-pipeline-health.query';

import type { PipelineRetryInput } from '@/modules/ops/types/queries.types';

// C-OPS-03 (task 69): re-runs a failed scoring job. 400 bad queue / blank job
// id, 404 unknown job - the hook surfaces those to the caller for the toast.
async function retryPipelineJob(input: PipelineRetryInput): Promise<void> {
  const res = await strapi.post<{ data: unknown }>('/api/ops/pipeline/retry', {
    queue: input.queue,
    job_id: input.jobId,
  });
  pipelineRetryResultSchema.parse(res.data.data);
}

export function usePipelineRetryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: retryPipelineJob,
    // A retried job leaves the failed set - refresh the counts at once.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PIPELINE_HEALTH_QUERY_KEY }),
  });
}
