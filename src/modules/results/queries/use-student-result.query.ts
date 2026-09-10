'use client';

import { useQuery } from '@tanstack/react-query';

import { resultViewSchema, type ResultView } from '@schooltest/scoring-contracts';

import { strapi } from '@/lib/axios/strapi';
import {
  legacyResultViewSchema,
  type LegacyResultView,
} from '@/modules/report/schemas/result-view.schema';

export type ResultPayload =
  { kind: 'v2'; view: ResultView } | { kind: 'legacy'; view: LegacyResultView };

/**
 * C-4 canonical read: GET /api/results/{documentId}, with same-model history.
 * Ownership is the server's job, so the portal never filters and never retries
 * a 403/404. Current reading rows use v2; legacy, listening and scoring_failed
 * rows retain the server's legacy view.
 */
export async function fetchStudentResult(resultId: string): Promise<ResultPayload> {
  const response = await strapi.get(`/api/results/${resultId}`);
  const v2 = resultViewSchema.safeParse(response.data);
  if (v2.success) return { kind: 'v2', view: v2.data };
  return { kind: 'legacy', view: legacyResultViewSchema.parse(response.data) };
}

export function useStudentResultQuery(resultId: string, enabled = true) {
  return useQuery({
    queryKey: ['results', 'student', resultId],
    queryFn: () => fetchStudentResult(resultId),
    enabled: enabled && Boolean(resultId),
    staleTime: 0,
    retry: false,
  });
}

export const useResultQuery = useStudentResultQuery;
