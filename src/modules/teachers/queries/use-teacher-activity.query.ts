'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { teacherActivityQueryKey } from '@/modules/teachers/constants/queries.constants';
import { teacherActivitySchema } from '@/modules/teachers/schemas/teachers.schema';
import type { TeacherActivity } from '@/modules/teachers/schemas/teachers.schema';

// C-TCH-07 (SA-FAIL-5): the teacher-detail "Recent activity" feed — the
// teacher's OWN sitting lifecycle events (opened/closed), newest first. An
// empty list is a MEASURED fact (a teacher who has not opened a sitting yet),
// never an error and never filled with anything else.
async function fetchTeacherActivity(documentId: string): Promise<TeacherActivity> {
  const res = await strapi.get<{ data: unknown }>(
    `/api/schools/me/teachers/${documentId}/activity`,
  );
  return teacherActivitySchema.parse(res.data.data);
}

export function useTeacherActivityQuery(documentId: string, enabled: boolean) {
  return useQuery({
    queryKey: teacherActivityQueryKey(documentId),
    queryFn: () => fetchTeacherActivity(documentId),
    enabled,
  });
}
