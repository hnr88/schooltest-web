'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { classRosterResponseSchema } from '@/modules/results/schemas/roster.schema';
import type { RosterRow } from '@/modules/results/types/roster.types';

/**
 * spec v2 §6.3 — the roster read: GET /api/my/students/results?class=<classId>,
 * already scoped server-side to this teacher's own class. Answers ONE ROW PER
 * ROSTER STUDENT (task 23 contract), `result: null` where the student holds no
 * official Result — so unscored students are rows at all, "No result yet" can
 * render, and a scored/total tile can carry the real roster size.
 *
 * SCORING/10 — rows carry `release_state` beside `result`, and a v2 `result`
 * carries `history[]` (the package's 8-point window, oldest first) for the
 * class chart and subskill sparklines. This hook keeps its own cache key; the
 * duplicate report read (`use-my-student-results.query.ts`) is mvp/teacher's to
 * fold (D-SC-12) — extended, never merged here.
 *
 * WIRING (task 33): this is the ONE read behind the class detail — the header
 * tiles, the Students tab and both Screen B tabs all consume this payload. The
 * retired per-tab reads (C-TR-1/3/4) lose their callers in task 34, which is
 * what unblocks the api-side route retirement (task 24). The api half of the
 * task 23 contract (the `class` param + wrapper shape) lands separately; the
 * e2e specs intercept this URL until it does.
 */
export async function fetchClassResults(classId: string): Promise<RosterRow[]> {
  const response = await strapi.get('/api/my/students/results', {
    params: { class: classId },
  });
  return classRosterResponseSchema.parse(response.data);
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
