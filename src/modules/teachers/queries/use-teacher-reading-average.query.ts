'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { teacherReadingAverageQueryKey } from '@/modules/teachers/constants/queries.constants';
import { teacherReadingAverageSchema } from '@/modules/teachers/schemas/teachers.schema';
import type { TeacherReadingAverage } from '@/modules/teachers/schemas/teachers.schema';

// C-TCH-06 (SA-FAIL-5): the school-admin reading-average read for one teacher
// — the per-class tile statistic pooled over ALL their classes. A NULL
// avg_reading_score is a MEASURED fact (no completed scored test yet), never
// an error and never rendered as 0.
async function fetchTeacherReadingAverage(documentId: string): Promise<TeacherReadingAverage> {
  const res = await strapi.get<{ data: unknown }>(
    `/api/schools/me/teachers/${documentId}/reading-average`,
  );
  return teacherReadingAverageSchema.parse(res.data.data);
}

export function useTeacherReadingAverageQuery(documentId: string, enabled: boolean) {
  return useQuery({
    queryKey: teacherReadingAverageQueryKey(documentId),
    queryFn: () => fetchTeacherReadingAverage(documentId),
    enabled,
  });
}
