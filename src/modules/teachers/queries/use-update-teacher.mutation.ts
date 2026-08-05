'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi, type StrapiSingleResponse } from '@/lib/axios/strapi';
import { TEACHERS_QUERY_KEY } from '@/modules/teachers/constants/queries.constants';
import { schoolTeacherSchema } from '@/modules/teachers/schemas/teachers.schema';
import type { SchoolTeacher, UpdateTeacherInput } from '@/modules/teachers/types/teachers.types';

// C-TCH-04: edit one staff account of the caller's own school (first_name,
// last_name, email). A duplicate email answers 400 ValidationError and the
// dialog puts the server's own message on the email field. The response is the
// listTeachers row for that teacher, parsed rather than assumed, and the roster
// is invalidated so the table re-reads from the server.
async function updateTeacherRequest({
  documentId,
  values,
}: UpdateTeacherInput): Promise<SchoolTeacher> {
  const res = await strapi.patch<StrapiSingleResponse<unknown>>(
    `/api/schools/me/teachers/${documentId}`,
    values,
  );
  return schoolTeacherSchema.parse(res.data.data);
}

export function useUpdateTeacherMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTeacherRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TEACHERS_QUERY_KEY }),
  });
}
