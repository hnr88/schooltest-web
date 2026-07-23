'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { resultViewSchema } from '@/modules/report/schemas/result-view.schema';
import type { ResultView } from '@/modules/report/types/report.types';

// C-4: GET /api/results/:documentId answers a BARE ResultView (no {data, meta}).
// Ownership is the server's job — admin any, student own, teacher own-students
// OFFICIAL only — so the portal never filters and never retries a 403/404.
async function fetchResult(documentId: string): Promise<ResultView> {
  const response = await strapi.get(`/api/results/${documentId}`);
  return resultViewSchema.parse(response.data);
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
