'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { TEACHER_CLASSES_PATH } from '@/modules/teacher/constants/test-session-setup.constants';
import { teacherClassesResponseSchema } from '@/modules/teacher/schemas/teacher-class.schema';
import type { TeacherClass } from '@/modules/teacher/types/teacher-class.types';

// The teacher's OWN classes, straight off `GET /api/classes` (C-8) — the
// ownership filter is applied server-side, so this hook sends no teacher id and
// could not widen its own scope if it tried. There is no client-side fallback:
// a failed read surfaces as an error state, never as an empty picker.
async function fetchTeacherClasses(): Promise<TeacherClass[]> {
  const response = await strapi.get(TEACHER_CLASSES_PATH);
  return teacherClassesResponseSchema.parse(response.data).data;
}

export function useTeacherClassesQuery(enabled = true) {
  return useQuery({
    queryKey: ['teacher', 'classes'],
    queryFn: fetchTeacherClasses,
    enabled,
    staleTime: 0,
    retry: false,
  });
}
