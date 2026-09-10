'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { strapi } from '@/lib/axios/strapi';
import {
  resultReviewBodySchema,
  resultReviewSchema,
  type ResultReview,
  type ResultReviewBody,
  type ReviewItem,
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

/**
 * The wire row ONE mark commit sends, kept pure so the source mapping is
 * testable beside the guards. Mapping (the design's `commit` copy is the rule):
 * a mark equal to the suggestion on a scored assist is an ACCEPT; anything
 * else the teacher sets is an OVERRIDE; a decline-to-mark on an assist that
 * itself declined carries the assist's own `decline_kind` beside
 * `teacher_mark_source: 'declined'` (the contract only allows the pair
 * `blank`/`language` there — exactly the two assist kinds that carry a
 * decline sentence).
 */
export function reviewMarkPayload(
  item: {
    response_document_id: string;
    rubric_score?: ReviewItem['rubric_score'];
  },
  value: number | null,
  source: 'accepted' | 'overridden' | 'declined' | null,
): ResultReviewBody['responses'][number] {
  const assist = item.rubric_score;
  if (source === 'declined') {
    const kind = assist?.decline_kind;
    return {
      response_document_id: item.response_document_id,
      teacher_mark: null,
      teacher_mark_source: 'declined',
      decline_kind: kind === 'blank' || kind === 'language' ? kind : undefined,
    };
  }
  return {
    response_document_id: item.response_document_id,
    teacher_mark: value,
    teacher_mark_source: source,
  };
}

/** The reset row (`:2965`): the mark key is deleted, never zeroed. */
export function reviewResetPayload(
  item: { response_document_id: string },
): ResultReviewBody['responses'][number] {
  return {
    response_document_id: item.response_document_id,
    teacher_mark: null,
    teacher_mark_source: null,
  };
}

/** The source a scale/accept click produces on a scored (non-declined) row. */
export function reviewSourceForValue(
  item: { rubric_score?: ReviewItem['rubric_score'] },
  value: number,
): 'accepted' | 'overridden' {
  const dimensions = item.rubric_score?.dimensions;
  const suggested =
    dimensions === null || dimensions === undefined
      ? null
      : Object.values(dimensions).reduce((total, band) => total + band, 0);
  return suggested !== null && value === suggested ? 'accepted' : 'overridden';
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
