'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi, type StrapiSingleResponse } from '@/lib/axios/strapi';
import { SCHOOL_CHILDREN_QUERY_KEY } from '@/modules/school-children/queries/use-school-children.query';

// The C-ENT-01 seat counters are computed at read; archiving releases the
// child's seat immediately, so the entitlement cache goes stale on success.
const ENTITLEMENT_QUERY_KEY = ['school-admin', 'entitlement'] as const;

interface ArchiveChildResult {
  documentId: string;
  status: string;
}

// C-CHD-04: flips status to 'archived' only — the record is never deleted.
async function archiveChildRequest(documentId: string): Promise<ArchiveChildResult> {
  const res = await strapi.post<StrapiSingleResponse<ArchiveChildResult>>(
    `/api/schools/me/children/${documentId}/archive`,
  );
  return res.data.data;
}

export function useArchiveChildMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: archiveChildRequest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SCHOOL_CHILDREN_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ENTITLEMENT_QUERY_KEY });
    },
  });
}
