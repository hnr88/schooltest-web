'use client';

import { isAxiosError } from 'axios';
import { useQuery } from '@tanstack/react-query';

import { strapi, type StrapiSingleResponse } from '@/lib/axios/strapi';
import { classStudentDetailSchema } from '@/modules/classes/schemas/class-detail.schema';
import type { ClassStudentDetail } from '@/modules/classes/types/class-detail.types';
import { CLASS_STUDENT_QUERY_KEY } from '@/modules/classes/constants/queries.constants';

// C-CLS-06: one student's drill-down inside a class — identity, background and
// the same two StudentTestResult objects the class table reads, with the
// subskill evidence. Same 404-is-not-found / rethrow-everything-else discipline
// as the class detail read.
async function fetchClassStudent(
  classDocumentId: string,
  studentDocumentId: string,
): Promise<ClassStudentDetail | null> {
  try {
    const res = await strapi.get<StrapiSingleResponse<unknown>>(
      `/api/schools/me/classes/${classDocumentId}/students/${studentDocumentId}`,
    );
    return classStudentDetailSchema.parse(res.data.data);
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) return null;
    throw error;
  }
}

export function useClassStudentQuery(
  classDocumentId: string,
  studentDocumentId: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: [...CLASS_STUDENT_QUERY_KEY, classDocumentId, studentDocumentId],
    queryFn: () => fetchClassStudent(classDocumentId, studentDocumentId),
    enabled,
  });
}
