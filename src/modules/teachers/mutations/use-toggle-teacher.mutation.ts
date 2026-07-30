'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi, type StrapiSingleResponse } from '@/lib/axios/strapi';
import { TEACHERS_QUERY_KEY } from '@/modules/teachers/queries/use-teachers.query';
import { toggleTeacherResponseSchema } from '@/modules/teachers/schemas/teachers.schema';

// C-TCH-02: deactivate/reactivate toggles user.blocked. Deactivated teachers
// keep their records (never deleted); a blocked account can no longer sign in.
async function toggleTeacherRequest(documentId: string, action: 'deactivate' | 'reactivate') {
  const res = await strapi.post<StrapiSingleResponse<unknown>>(
    `/api/schools/me/teachers/${documentId}/${action}`,
  );
  return toggleTeacherResponseSchema.parse(res.data.data);
}

function useToggle(action: 'deactivate' | 'reactivate') {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) => toggleTeacherRequest(documentId, action),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TEACHERS_QUERY_KEY }),
  });
}

export function useDeactivateTeacherMutation() {
  return useToggle('deactivate');
}

export function useReactivateTeacherMutation() {
  return useToggle('reactivate');
}
