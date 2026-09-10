'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import {
  resultReviewBodySchema,
  resultReviewSchema,
  type ResultReview,
  type ResultReviewBody,
} from '@/modules/teacher/schemas/teacher-review.schema';

export type ReviewMarkDecision =
  | { kind: 'commit' }
  | { kind: 'confirm'; tone: 'destructive' | 'neutral' };

/**
 * The four design guards, kept pure so their destructive/neutral boundaries
 * are testable without mounting a drawer or sending a request.
 */
export function reviewMarkDecision(input: {
  value: number;
  suggested: number;
  max: number;
  declined: boolean;
}): ReviewMarkDecision {
  if (input.declined && input.value === 0) {
    return { kind: 'confirm', tone: 'destructive' };
  }
  if (!input.declined && input.value - input.suggested <= -2) {
    return { kind: 'confirm', tone: 'neutral' };
  }
  if (!input.declined && input.value === input.max && input.suggested === input.max) {
    return { kind: 'confirm', tone: 'neutral' };
  }
  return { kind: 'commit' };
}

export interface SaveResultReviewInput {
  documentId: string;
  body: ResultReviewBody;
}

export async function saveResultReview(input: SaveResultReviewInput): Promise<ResultReview> {
  const body = resultReviewBodySchema.parse(input.body);
  const response = await strapi.put(
    `/api/results/${encodeURIComponent(input.documentId)}/review`,
    body,
  );
  return resultReviewSchema.parse(response.data);
}

export function useResultReviewMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveResultReview,
    onSuccess: (review) => {
      queryClient.setQueryData(['results', 'review', review.document_id], review);
      void queryClient.invalidateQueries({ queryKey: ['results', 'review', review.document_id] });
      void queryClient.invalidateQueries({ queryKey: ['teacher'] });
      void queryClient.invalidateQueries({ queryKey: ['result'] });
    },
  });
}
