'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi, type StrapiSingleResponse } from '@/lib/axios/strapi';
import { SCHOOL_CHILDREN_QUERY_KEY } from '@/modules/school-students/constants/queries.constants';

import type { ArchiveStudentResult } from '@/modules/school-students/types/queries.types';
import { ENTITLEMENT_QUERY_KEY } from '@/modules/school-students/constants/queries.constants';

// C-CHD-04: flips status to 'archived' only — the record is never deleted.
async function archiveStudentRequest(documentId: string): Promise<ArchiveStudentResult> {
  const res = await strapi.post<StrapiSingleResponse<ArchiveStudentResult>>(
    `/api/schools/me/children/${documentId}/archive`,
  );
  return res.data.data;
}

export function useArchiveStudentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: archiveStudentRequest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SCHOOL_CHILDREN_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ENTITLEMENT_QUERY_KEY });
    },
  });
}
