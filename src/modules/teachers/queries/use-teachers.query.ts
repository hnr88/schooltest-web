'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi, type StrapiCollectionResponse } from '@/lib/axios/strapi';
import { schoolTeacherSchema } from '@/modules/teachers/schemas/teachers.schema';
import type { SchoolTeacher } from '@/modules/teachers/types/teachers.types';

export const TEACHERS_QUERY_KEY = ['school', 'teachers'] as const;

// C-TCH-01: staff accounts of the caller's school (teacher + school_admin
// roles), school-scoped server-side.
async function fetchTeachers(): Promise<SchoolTeacher[]> {
  const res = await strapi.get<StrapiCollectionResponse<unknown>>('/api/schools/me/teachers');
  return res.data.data.map((row) => schoolTeacherSchema.parse(row));
}

export function useTeachersQuery(enabled: boolean) {
  return useQuery({ queryKey: TEACHERS_QUERY_KEY, queryFn: fetchTeachers, enabled });
}
