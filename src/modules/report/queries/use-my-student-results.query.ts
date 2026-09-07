'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { myStudentsResultsResponseSchema } from '@/modules/report/schemas/result-view.schema';
import type { MyStudentsResultsRow } from '@/modules/report/schemas/result-view.schema';

// C-11: GET /api/my/students/results answers a BARE array, already scoped
// server-side to this teacher's own students AND destination=official — practice
// results never reach a teacher surface (Doc 0 s.9). Hard cap 100, no pagination.
//
// A ROW IS EITHER VIEW. The server dispatches per row exactly as the C-4 read
// does (`use-result.query.ts`): the contract `ResultView` for a current reading
// row, its own v1 view for the two populations v2 refuses (`scoring_failed`,
// listening). Parsing v2 alone made every one of those rows an error fallback —
// and, until the server was fixed, made the whole list a 400.
export async function fetchMyStudentResults(): Promise<MyStudentsResultsRow[]> {
  const response = await strapi.get('/api/my/students/results');
  return myStudentsResultsResponseSchema.parse(response.data);
}

export function useMyStudentResultsQuery(enabled = true) {
  return useQuery({
    queryKey: ['report', 'my-student-results'],
    queryFn: fetchMyStudentResults,
    enabled,
    staleTime: 0,
    retry: false,
  });
}
