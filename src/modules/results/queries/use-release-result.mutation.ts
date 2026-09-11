'use client';

import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { releaseInSequence } from '@/modules/results/lib/release-batch';
import { resultReleaseOutcomeSchema } from '@/modules/results/schemas/result-release.schema';
import type { ReleaseBatchOutcome, ResultReleaseOutcome } from '@/modules/results/types/result-release.types';

export async function releaseResult(resultDocumentId: string): Promise<ResultReleaseOutcome> {
  const response = await strapi.post(`/api/results/${encodeURIComponent(resultDocumentId)}/release`);
  return resultReleaseOutcomeSchema.parse(response.data);
}

export function invalidateReleaseReads(queryClient: QueryClient): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: ['results'] });
}

export function useReleaseResultMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: releaseResult,
    onSettled: () => invalidateReleaseReads(queryClient),
  });
}

export function useReleaseHeldResultsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (resultDocumentIds: readonly string[]): Promise<ReleaseBatchOutcome> =>
      releaseInSequence(resultDocumentIds, releaseResult),
    onSettled: () => invalidateReleaseReads(queryClient),
  });
}
