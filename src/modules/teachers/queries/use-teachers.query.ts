'use client';

import { useQuery } from '@tanstack/react-query';
import type { z } from 'zod';

import { strapi, type StrapiCollectionResponse } from '@/lib/axios/strapi';
import { schoolTeacherSchema } from '@/modules/teachers/schemas/teachers.schema';
import { TEACHERS_QUERY_KEY } from '@/modules/teachers/constants/queries.constants';

// C-TCH-01: staff accounts of the caller's school (teacher + school_admin
// roles), school-scoped server-side. The parsed type (not the hand-written
// SchoolTeacher interface) is what flows out, so the role/last_active_at/
// createdAt keys the schema declares survive to the consumers.
export type ParsedSchoolTeacher = z.infer<typeof schoolTeacherSchema>;

async function fetchTeachers(): Promise<ParsedSchoolTeacher[]> {
  const res = await strapi.get<StrapiCollectionResponse<unknown>>('/api/schools/me/teachers');
  return res.data.data.map((row) => schoolTeacherSchema.parse(row));
}

export function useTeachersQuery(enabled: boolean) {
  return useQuery({ queryKey: TEACHERS_QUERY_KEY, queryFn: fetchTeachers, enabled });
}
