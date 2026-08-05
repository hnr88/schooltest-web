'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi, type StrapiSingleResponse } from '@/lib/axios/strapi';
import { SCHOOL_CHILDREN_QUERY_KEY } from '@/modules/school-students/constants/queries.constants';
import { schoolStudentDetailSchema } from '@/modules/school-students/schemas/school-student.schema';
import type {
  StudentWriteBody,
  SchoolStudentDetail,
} from '@/modules/school-students/types/school-students.types';

import type { UpdateStudentInput } from '@/modules/school-students/types/queries.types';

// C-CHD-03: partial whitelist write-back; class_documentId: null unassigns.
async function updateStudentRequest({ documentId, body }: UpdateStudentInput): Promise<SchoolStudentDetail> {
  const res = await strapi.patch<StrapiSingleResponse<unknown>>(
    `/api/schools/me/children/${documentId}`,
    body,
  );
  return schoolStudentDetailSchema.parse(res.data.data);
}

export function useUpdateStudentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateStudentRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SCHOOL_CHILDREN_QUERY_KEY }),
  });
}
