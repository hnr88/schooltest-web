'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { suggestedMark } from '@/modules/report/lib/review-display';
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
  const suggested = suggestedMark({ rubric_score: item.rubric_score ?? null });
  return suggested !== null && value === suggested ? 'accepted' : 'overridden';
}

/**
 * "Save comments" as ONE PUT: every question note that changed, plus the
 * overall comment when it changed; `null` when nothing did. The route writes
 * `teacher_mark`/`teacher_mark_source` on EVERY listed row, so each row
 * re-sends its current mark — saving a note must never clear a mark. An
 * emptied note or comment is sent as `null`, the served "nothing written".
 */
export function reviewSavePayload(input: {
  items: readonly ReviewItem[];
  notes: Readonly<Record<string, string>>;
  comment: string;
  servedComment: string | null;
}): ResultReviewBody | null {
  const responses: ResultReviewBody['responses'] = [];
  for (const item of input.items) {
    const id = item.response_document_id;
    if (id === undefined || !(id in input.notes)) continue;
    const note = input.notes[id].trim() === '' ? null : input.notes[id];
    if (note === (item.teacher_note ?? null)) continue;
    const source = item.teacher_mark_source ?? null;
    const mark =
      source === 'declined'
        ? reviewMarkPayload({ response_document_id: id, rubric_score: item.rubric_score }, null, source)
        : { response_document_id: id, teacher_mark: item.teacher_mark ?? null, teacher_mark_source: source };
    responses.push({ ...mark, teacher_note: note });
  }
  const comment = input.comment.trim() === '' ? null : input.comment;
  const commentChanged = comment !== input.servedComment;
  if (responses.length === 0 && !commentChanged) return null;
  return commentChanged ? { responses, comment } : { responses };
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
      // The comment and marks belong to the student's result: refresh its own
      // read and every roster that lists it. (The old `['result']` key matched
      // no query, so the result never refreshed after a review.)
      void queryClient.invalidateQueries({ queryKey: ['results', 'student', review.document_id] });
      void queryClient.invalidateQueries({ queryKey: ['results', 'class'] });
      void queryClient.invalidateQueries({ queryKey: ['report', 'my-student-results'] });
      void queryClient.invalidateQueries({ queryKey: ['teacher'] });
    },
  });
}
