'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { startTestSessionResponseSchema } from '@/modules/teacher/schemas/teacher-session.schema';
import type { StartTestSessionResponse } from '@/modules/teacher/types/teacher-session.types';

// C-TS-7: POST /api/teacher/test-sessions/:documentId/start -> 200. Starts a
// booking now: the code is minted and it runs (`phase: 'running'`). A busy
// member is a 409 with `details.busy_student_document_ids`; a sitting that is
// no longer a booking is a 409 with `details.phase`.
async function startTestSession(documentId: string): Promise<StartTestSessionResponse> {
  const response = await strapi.post(`/api/teacher/test-sessions/${documentId}/start`);
  return startTestSessionResponseSchema.parse(response.data);
}

export function useStartTestSessionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: startTestSession,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['teacher'] });
      void queryClient.invalidateQueries({ queryKey: ['test-day', 'sittings'] });
      void queryClient.invalidateQueries({ queryKey: ['test-day', 'sitting-history'] });
    },
  });
}
