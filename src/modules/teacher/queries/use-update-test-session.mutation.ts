'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import {
  testSessionBookingSchema,
  updateTestSessionBodySchema,
} from '@/modules/teacher/schemas/teacher-session.schema';
import type {
  TestSessionBooking,
  UpdateTestSessionInput,
} from '@/modules/teacher/types/teacher-session.types';

// C-TS-5: PATCH /api/teacher/test-sessions/:documentId -> 200 with the saved
// booking. Only a booking can be edited: a refused window is a 400 with
// `details.schedule_errors`, a clash a 409 with `details.clashes`, and a
// sitting that already opened, closed or was cancelled a 409 with `details.phase`.
async function updateTestSession({ documentId, body }: UpdateTestSessionInput): Promise<TestSessionBooking> {
  const payload = updateTestSessionBodySchema.parse(body);
  const response = await strapi.patch(`/api/teacher/test-sessions/${documentId}`, payload);
  return testSessionBookingSchema.parse(response.data);
}

export function useUpdateTestSessionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTestSession,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['teacher'] });
      void queryClient.invalidateQueries({ queryKey: ['test-day', 'sittings'] });
      void queryClient.invalidateQueries({ queryKey: ['test-day', 'sitting-history'] });
    },
  });
}
