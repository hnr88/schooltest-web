'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import {
  createTestSessionBodySchema,
  createTestSessionResponseSchema,
} from '@/modules/teacher/schemas/teacher-session.schema';
import type {
  CreateTestSessionBody,
  CreateTestSessionResponse,
} from '@/modules/teacher/types/teacher-session.types';

// C-TS-1: POST /api/teacher/test-sessions -> 201 with the minted six-digit code.
// The body is parsed BEFORE the request so a malformed documentId fails here
// rather than as a server 400, and the 201 is parsed on the way back. The code
// is the server's (F-SITTING-CODE, DECISIONS.md A3) — nothing is minted here.
// Optional `student_document_ids`, `settings` and `start` (server default true)
// are the start-now fields; a 409 carries `details.busy_student_document_ids`.
async function createTestSession(body: CreateTestSessionBody): Promise<CreateTestSessionResponse> {
  const payload = createTestSessionBodySchema.parse(body);
  const response = await strapi.post('/api/teacher/test-sessions', payload);
  return createTestSessionResponseSchema.parse(response.data);
}

export function useCreateTestSessionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTestSession,
    onSuccess: () => {
      // A new sitting changes the C-TS-2 list, the C-TD-1 live banner AND the
      // test-day stack's class sittings and sitting history.
      void queryClient.invalidateQueries({ queryKey: ['teacher'] });
      void queryClient.invalidateQueries({ queryKey: ['test-day', 'sittings'] });
      void queryClient.invalidateQueries({ queryKey: ['test-day', 'sitting-history'] });
    },
  });
}
