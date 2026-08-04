'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { CLASS_SITTINGS_QUERY_KEY } from '@/modules/test-day/constants/queries.constants';
import { SITTING_MONITOR_QUERY_KEY } from '@/modules/test-day/constants/queries.constants';

// POST /api/sittings/:documentId/code — mints the access code (or returns the
// existing one). Revealing the code is the teacher's only start control
// (mvp-updates §4.5).
async function revealCodeRequest(sittingDocumentId: string): Promise<string> {
  const res = await strapi.post<{ code: string }>(`/api/sittings/${sittingDocumentId}/code`);
  return res.data.code;
}

export function useRevealCodeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revealCodeRequest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CLASS_SITTINGS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: SITTING_MONITOR_QUERY_KEY });
    },
  });
}
