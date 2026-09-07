'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseDataEnvelope, strapi } from '@/lib/axios/strapi';
import {
  OPS_SITTING_MONITOR_QUERY_KEY,
  SCHOOL_SITTINGS_QUERY_KEY,
} from '@/modules/ops/constants/queries.constants';
import { invalidateResultSchema } from '@/modules/ops/schemas/recovery.schema';

// C-OPS-PORTAL-063 / C-OPS-02 (task 69, OPS-073): closes the sitting,
// terminates in-flight sessions and stamps every session invalidated_at, so the
// attempt stays stored for audit but leaves official reporting.
//
// The call opts into the versioned portal contract: `opsPortalVersioned` sends
// X-Ops-Portal-Version: 1, which selects a wire shape and grants nothing. The
// body is deliberately `undefined` — the operation takes NO body, and a
// versioned request carrying one is refused with a 400 field error rather than
// having it silently ignored.
//
// The 200 body goes through the shared envelope parser, so a server that
// answered 200 with a drifted payload throws RestContractViolation here instead
// of flowing into the panel as a silent success.
async function invalidateSitting(sittingDocumentId: string) {
  const res = await strapi.post<unknown>(
    `/api/ops/sittings/${encodeURIComponent(sittingDocumentId)}/invalidate`,
    undefined,
    { opsPortalVersioned: true },
  );
  return parseDataEnvelope(invalidateResultSchema, res.data);
}

export function useInvalidateSittingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: invalidateSitting,
    // Exactly the two caches this write moves: the picker (the sitting flips to
    // `closed`) and the monitor board (its states flip to submitted). Dropping
    // the whole `['ops']` tree here also refetched unrelated ops panels on the
    // same screen for no reason.
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: SCHOOL_SITTINGS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: OPS_SITTING_MONITOR_QUERY_KEY }),
      ]);
    },
  });
}
