'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { invalidateReleaseReads } from '@/modules/results/queries/use-release-result.mutation';
import {
  resultRecallBodySchema,
  resultReleaseOutcomeSchema,
} from '@/modules/results/schemas/result-release.schema';
import type { RecallResultInput, ResultReleaseOutcome } from '@/modules/results/types/result-release.types';

export async function recallResult({ resultDocumentId, recallReason }: RecallResultInput): Promise<ResultReleaseOutcome> {
  const body = resultRecallBodySchema.parse({ recall_reason: recallReason });
  const response = await strapi.post(`/api/results/${encodeURIComponent(resultDocumentId)}/recall`, body);
  return resultReleaseOutcomeSchema.parse(response.data);
}

export function useRecallResultMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: recallResult,
    onSettled: () => invalidateReleaseReads(queryClient),
  });
}
