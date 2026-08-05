'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi, type StrapiSingleResponse } from '@/lib/axios/strapi';
import { SCHOOL_CHILDREN_QUERY_KEY } from '@/modules/school-students/constants/queries.constants';
import { schoolStudentDetailSchema } from '@/modules/school-students/schemas/school-student.schema';
import type {
  StudentWriteBody,
  SchoolStudentDetail,
} from '@/modules/school-students/types/school-students.types';
import { ENTITLEMENT_QUERY_KEY } from '@/modules/school-students/constants/queries.constants';

// C-CHD-02: create the student inside the caller's own school (the school comes
// from the session server-side, never from the body). The seat gate may 403
// with SEAT_CAP / SCHOOL_INACTIVE — classify-student-error maps those.
async function createStudentRequest(body: StudentWriteBody): Promise<SchoolStudentDetail> {
  const res = await strapi.post<StrapiSingleResponse<unknown>>('/api/schools/me/children', body);
  return schoolStudentDetailSchema.parse(res.data.data);
}

export function useCreateStudentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createStudentRequest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SCHOOL_CHILDREN_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ENTITLEMENT_QUERY_KEY });
    },
  });
}
