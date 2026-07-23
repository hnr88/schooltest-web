'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { myStudentsResultsResponseSchema } from '@/modules/report/schemas/result-view.schema';
import type { ResultView } from '@/modules/report/types/report.types';

// C-11: GET /api/my/students/results answers a BARE array, already scoped
// server-side to this teacher's own students AND destination=official — practice
// results never reach a teacher surface (Doc 0 s.9). Hard cap 100, no pagination.
async function fetchMyStudentResults(): Promise<ResultView[]> {
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
