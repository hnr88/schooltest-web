'use client';

import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import { strapi, type StrapiSingleResponse } from '@/lib/axios/strapi';
import { schoolStudentRecordSchema } from '@/modules/school-students/schemas/school-student.schema';
import type { SchoolStudentRecord } from '@/modules/school-students/types/school-students.types';
import { SCHOOL_CHILD_DETAIL_QUERY_KEY } from '@/modules/school-students/constants/queries.constants';

// C-CHD-06: one student of the caller's own school. The server answers the same
// 404 for an unknown documentId and for a student of another school, so the
// two collapse into `null` here and the screen shows one not-found state; every
// other failure stays an error so the retry affordance still applies.
async function fetchSchoolStudent(documentId: string): Promise<SchoolStudentRecord | null> {
  try {
    const res = await strapi.get<StrapiSingleResponse<unknown>>(
      `/api/schools/me/children/${documentId}`,
    );
    return schoolStudentRecordSchema.parse(res.data.data);
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

export function useSchoolStudentQuery(documentId: string, enabled: boolean) {
  return useQuery({
    queryKey: [...SCHOOL_CHILD_DETAIL_QUERY_KEY, documentId],
    queryFn: () => fetchSchoolStudent(documentId),
    enabled,
  });
}
