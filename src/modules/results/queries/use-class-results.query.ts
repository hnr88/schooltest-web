'use client';

import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { resultViewSchema, type ResultView } from '@schooltest/scoring-contracts';

import { strapi } from '@/lib/axios/strapi';

/**
 * spec v2 §6.3 — the roster read: GET /api/my/students/results?class=<classId>,
 * already scoped server-side to this teacher's own students and
 * destination=official. Answers a BARE array (no {data, meta} envelope — same
 * shape the v1 route answers today), and rows OMIT `history` for payload size:
 * an omitted key must never be read as "this student has no sittings".
 *
 * WIRING MARK (task 29 running early): the shared schema describes the TARGET
 * v2 view, but the live API still emits the v1 shape (stored rows keyed R1..R7)
 * until tasks 16 and 23 land — this parse fails against today's response on
 * purpose, which is exactly the contract drift task 23 needs to see. Screens
 * (task 33) wire up only after 23; nothing imports this hook yet.
 */
const classResultsResponseSchema = z.array(resultViewSchema);

export async function fetchClassResults(classId: string): Promise<ResultView[]> {
  const response = await strapi.get('/api/my/students/results', {
    params: { class: classId },
  });
  return classResultsResponseSchema.parse(response.data);
}

export function useClassResultsQuery(classId: string, enabled = true) {
  return useQuery({
    queryKey: ['results', 'class', classId],
    queryFn: () => fetchClassResults(classId),
    enabled: enabled && Boolean(classId),
    staleTime: 0,
    retry: false,
  });
}
