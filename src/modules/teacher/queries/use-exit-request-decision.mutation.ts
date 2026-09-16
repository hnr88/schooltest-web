'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { exitRequestDecisionResponseSchema } from '@/modules/teacher/schemas/exit-request.schema';
import type {
  ExitRequestDecision,
  ExitRequestDecisionResponse,
} from '@/modules/teacher/schemas/exit-request.schema';

// SEMANTIC contract: POST the teacher's decision on ONE exit request — the
// verb endpoints `.../approve` and `.../deny`. Approval additionally flags the
// sitting server-side so the student's exit is sanctioned; the portal only
// reports the outcome it is handed.
const DECISION_VERB: Record<ExitRequestDecision, string> = {
  approved: 'approve',
  denied: 'deny',
};

async function decideExitRequest(
  requestId: string,
  decision: ExitRequestDecision,
): Promise<ExitRequestDecisionResponse> {
  const response = await strapi.post(`/api/exit-requests/${requestId}/${DECISION_VERB[decision]}`);
  return exitRequestDecisionResponseSchema.parse(response.data);
}

/**
 * Approve (`decision: 'approved'`) or deny (`decision: 'denied'`) a pending
 * exit request by id. Success invalidates the queue — the answered request
 * leaves it, and an approved sitting flag lands with the next monitor read.
 */
export function useExitRequestDecisionMutation() {
  const queryClient = useQueryClient();
  return useMutation<ExitRequestDecisionResponse, unknown, { requestId: string; decision: ExitRequestDecision }>({
    mutationFn: ({ requestId, decision }) => decideExitRequest(requestId, decision),
    onSuccess: () => {
      // Invalidate by prefix: every sitting's pending queue the portal cached.
      void queryClient.invalidateQueries({ queryKey: ['teacher', 'exit-requests'] });
    },
  });
}
