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
 * exit request by id. The queue is refetched whatever the outcome — a success
 * removes the answered request, and a failure (typically a 409: the student
 * withdrew it meanwhile) must not leave a stale row with live buttons.
 */
export function useExitRequestDecisionMutation() {
  const queryClient = useQueryClient();
  return useMutation<ExitRequestDecisionResponse, unknown, { requestId: string; decision: ExitRequestDecision }>({
    mutationFn: ({ requestId, decision }) => decideExitRequest(requestId, decision),
    onSettled: () => {
      // Invalidate by prefix: every sitting's pending queue the portal cached.
      void queryClient.invalidateQueries({ queryKey: ['teacher', 'exit-requests'] });
    },
  });
}
