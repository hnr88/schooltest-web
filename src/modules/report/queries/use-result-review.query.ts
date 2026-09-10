'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import {
  resultReviewSchema,
  type ResultReview,
} from '@/modules/teacher/schemas/teacher-review.schema';

/**
 * C-REV-1 — GET /api/results/:documentId/review, the ONE hook on this path
 * (scoring task 11).
 *
 * Unlike the export next door, this is a plain read: the drawer opens and the
 * teacher expects the sitting to be there, so it fetches on mount rather than
 * waiting for a control. `enabled` is therefore driven by the caller's open
 * state — a closed drawer must not fetch, and passing the open flag is what
 * makes that explicit at the call site instead of hiding it in a ref.
 *
 * Parsed STRICTLY at the boundary. The envelope is a strictObject, so a server
 * that grew a field the client does not know about fails here rather than
 * rendering a half-known row — and the answer key, the one thing this route
 * projects that no other does, is validated rather than trusted.
 */
export async function fetchResultReview(resultId: string): Promise<ResultReview> {
  const response = await strapi.get(`/api/results/${resultId}/review`);
  return resultReviewSchema.parse(response.data);
}

export function useResultReviewQuery(resultId: string, enabled = true) {
  return useQuery({
    queryKey: ['results', 'review', resultId],
    queryFn: () => fetchResultReview(resultId),
    enabled: enabled && Boolean(resultId),
    // A review is read while marking; it must not serve a stale sitting after
    // task 12's write lands, so it is not cached across opens.
    staleTime: 0,
    retry: false,
  });
}
