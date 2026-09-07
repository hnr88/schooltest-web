'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CommsPushBroadcastOperation,
  RestContractViolation,
  pushBroadcastResponseSchema,
  type PushBroadcastBody,
  type PushBroadcastResult,
} from '@schooltest/ops-contracts';

import { strapi } from '@/lib/axios/strapi';

// C-OPSM-04 — the push broadcast fan-out.
//
// Same `dryRun` discipline as the bulk email (always explicit; the server
// defaults a missing flag to TRUE), but the preview number means something
// different: the server resolves the audience to users and counts their
// registered push SUBSCRIPTIONS, so the figure is reachable devices, not
// people. A user with no subscription is in the audience and in nobody's count.
async function sendPushBroadcast(body: PushBroadcastBody): Promise<PushBroadcastResult> {
  const res = await strapi.post<unknown>(CommsPushBroadcastOperation.path, body);
  const parsed = pushBroadcastResponseSchema.safeParse(res.data);
  if (!parsed.success) throw new RestContractViolation(parsed.error.issues);
  return parsed.data.data;
}

export function usePushBroadcastMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sendPushBroadcast,
    // Only a real broadcast writes the `comms.push_broadcast` audit entry.
    onSuccess: async (result) => {
      if (result.dryRun) return;
      await queryClient.invalidateQueries({ queryKey: ['ops', 'audit-logs'] });
    },
  });
}
