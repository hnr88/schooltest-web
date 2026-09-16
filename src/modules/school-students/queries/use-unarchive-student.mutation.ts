'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi, type StrapiSingleResponse } from '@/lib/axios/strapi';
import { SCHOOL_CHILDREN_QUERY_KEY } from '@/modules/school-students/constants/queries.constants';

import type { ArchiveStudentResult } from '@/modules/school-students/types/queries.types';
import { ENTITLEMENT_QUERY_KEY } from '@/modules/school-students/constants/queries.constants';

// D10 — C-CHD-04b's missing UI half: flips status back to 'active' only, the
// exact mirror of the archive mutation (the record is never deleted, and the
// re-admitted student re-occupies a seat, hence the entitlement refresh).
async function unarchiveStudentRequest(documentId: string): Promise<ArchiveStudentResult> {
  const res = await strapi.post<StrapiSingleResponse<ArchiveStudentResult>>(
    `/api/schools/me/children/${documentId}/unarchive`,
  );
  return res.data.data;
}

export function useUnarchiveStudentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unarchiveStudentRequest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SCHOOL_CHILDREN_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ENTITLEMENT_QUERY_KEY });
    },
  });
}
