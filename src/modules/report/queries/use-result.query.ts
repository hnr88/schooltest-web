'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import {
  legacyResultViewSchema,
  resultViewSchema,
} from '@/modules/report/schemas/result-view.schema';
import type { ResultView } from '@/modules/report/types/report.types';
import type { LegacyResultView } from '@/modules/report/schemas/result-view.schema';

export type ResultPayload =
  | { kind: 'v2'; view: ResultView }
  | { kind: 'legacy'; view: LegacyResultView };

// C-4: GET /api/results/:documentId answers a BARE ResultView (no {data, meta}).
// Ownership is the server's job — admin any, student own, teacher own-students
// OFFICIAL only — so the portal never filters and never retries a 403/404.
// v2 rows parse against the contract; anything else (legacy-r7, listening,
// unscored) is the server's v1 view and parses against the legacy mirror, so a
// legacy result renders its stored statements instead of the error fallback.
async function fetchResult(documentId: string): Promise<ResultPayload> {
  const response = await strapi.get(`/api/results/${documentId}`);
  const v2 = resultViewSchema.safeParse(response.data);
  if (v2.success) return { kind: 'v2', view: v2.data };
  return { kind: 'legacy', view: legacyResultViewSchema.parse(response.data) };
}

export function useResultQuery(documentId: string) {
  return useQuery({
    queryKey: ['report', 'result', documentId],
    queryFn: () => fetchResult(documentId),
    enabled: Boolean(documentId),
    staleTime: 0,
    retry: false,
  });
}
