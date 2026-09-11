'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { cancelTestSessionResponseSchema } from '@/modules/teacher/schemas/teacher-session.schema';
import type { CancelTestSessionResponse } from '@/modules/teacher/types/teacher-session.types';

// C-TS-6: POST /api/teacher/test-sessions/:documentId/cancel -> 200. The
// booking becomes `phase: 'cancelled'`, `status: 'closed'`; a sitting that is
// no longer a booking is a 409 with `details.phase`.
async function cancelTestSession(documentId: string): Promise<CancelTestSessionResponse> {
  const response = await strapi.post(`/api/teacher/test-sessions/${documentId}/cancel`);
  return cancelTestSessionResponseSchema.parse(response.data);
}

export function useCancelTestSessionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelTestSession,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['teacher'] });
      void queryClient.invalidateQueries({ queryKey: ['test-day', 'sittings'] });
      void queryClient.invalidateQueries({ queryKey: ['test-day', 'sitting-history'] });
    },
  });
}
