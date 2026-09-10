'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { strapi } from '@/lib/axios/strapi';

import { resultStatusSchema } from '@schooltest/scoring-contracts';

const rescoreModeSchema = z.enum(['retry', 'rescore', 'manual']);
const rescoreResultSchema = z.strictObject({
  document_id: z.string().min(1),
  mode: rescoreModeSchema,
  status: resultStatusSchema,
  job_id: z.string().min(1),
});

export type RescoreResultMode = z.infer<typeof rescoreModeSchema>;
export type RescoreResult = z.infer<typeof rescoreResultSchema>;

async function rescoreResult(input: {
  documentId: string;
  mode: RescoreResultMode;
}): Promise<RescoreResult> {
  const response = await strapi.post(
    `/api/results/${encodeURIComponent(input.documentId)}/rescore`,
    { mode: rescoreModeSchema.parse(input.mode) },
  );
  return rescoreResultSchema.parse(response.data);
}

export function useRescoreResultMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: rescoreResult,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher'] });
      queryClient.invalidateQueries({ queryKey: ['result'] });
    },
  });
}
