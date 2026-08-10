'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { closeTestSessionResponseSchema } from '@/modules/teacher/schemas/teacher-session.schema';
import type { CloseTestSessionResponse } from '@/modules/teacher/types/teacher-session.types';

// C-TS-4: POST /api/teacher/test-sessions/:documentId/close -> 200. Delegates to
// the existing `api::sitting.code.closeSitting` cascade server-side; the portal
// only reports the outcome it is handed.
async function closeTestSession(documentId: string): Promise<CloseTestSessionResponse> {
  const response = await strapi.post(`/api/teacher/test-sessions/${documentId}/close`);
  return closeTestSessionResponseSchema.parse(response.data);
}

export function useCloseTestSessionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: closeTestSession,
    onSuccess: () => {
      // Closing clears the C-TD-1 live banner, flips the C-TS-2 row to `closed`
      // and terminates in-flight sessions the C-TS-3 grid is showing.
      queryClient.invalidateQueries({ queryKey: ['teacher'] });
    },
  });
}
