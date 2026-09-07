'use client';

import { useQuery } from '@tanstack/react-query';

import { resultViewSchema, type ResultView } from '@schooltest/scoring-contracts';

import { strapi } from '@/lib/axios/strapi';

/**
 * spec v2 §6.3 — the canonical read: GET /api/results/{documentId}, `history`
 * included (official, same-model-version sittings, oldest first, last 8).
 * Ownership is the server's job (admin any, student own, teacher own-students
 * OFFICIAL only), so the portal never filters and never retries a 403/404.
 *
 * WIRING MARK (task 29 running early): the schema is the TARGET v2 view; the
 * live API still emits the v1 shape until tasks 16 and 23 — this parse fails
 * against today's response by design. Screen C (task 30) wires up after 23;
 * nothing imports this hook yet.
 */
export async function fetchStudentResult(resultId: string): Promise<ResultView> {
  const response = await strapi.get(`/api/results/${resultId}`);
  return resultViewSchema.parse(response.data);
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
