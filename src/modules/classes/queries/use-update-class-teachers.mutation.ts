'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi, type StrapiSingleResponse } from '@/lib/axios/strapi';
import { CLASSES_QUERY_KEY } from '@/modules/classes/constants/queries.constants';
import { schoolClassSchema } from '@/modules/classes/schemas/class.schema';
import type { SchoolClass } from '@/modules/classes/types/classes.types';
import { TEACHERS_QUERY_KEY } from '@/modules/teachers';

export interface UpdateClassTeachersInput {
  documentId: string;
  teacherDocumentIds: string[];
}

async function updateClassTeachersRequest({
  documentId,
  teacherDocumentIds,
}: UpdateClassTeachersInput): Promise<SchoolClass> {
  const res = await strapi.patch<StrapiSingleResponse<unknown>>(
    `/api/schools/me/classes/${documentId}`,
    { teacher_documentIds: teacherDocumentIds },
  );
  return schoolClassSchema.parse(res.data.data);
}

export function useUpdateClassTeachersMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateClassTeachersRequest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CLASSES_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: TEACHERS_QUERY_KEY });
    },
  });
}
