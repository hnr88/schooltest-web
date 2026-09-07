'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  RestContractViolation,
  maintenanceActionRequestSchema,
  mediaPruneResponseSchema,
} from '@schooltest/ops-contracts';

import { strapi } from '@/lib/axios/strapi';
import { MEDIA_STATS_QUERY_KEY } from '@/modules/ops/constants/queries.constants';

/**
 * Ledger row 8c — C-OPSC-05 POST /api/ops/media/prune.
 *
 * DESTRUCTIVE with `dryRun: false`: deletes unreferenced upload files (row AND
 * stored object). The server's default is dry-run — the UI must send
 * `dryRun: false` EXPLICITLY behind the confirm dialog, and the response
 * echoes the flag plus what was actually removed.
 */
async function pruneMedia(input: { dryRun?: boolean }) {
  const parsedInput = maintenanceActionRequestSchema.safeParse(input);
  if (!parsedInput.success) throw new RestContractViolation(parsedInput.error.issues);
  const res = await strapi.post<unknown>('/api/ops/media/prune', parsedInput.data);
  const parsed = mediaPruneResponseSchema.safeParse(res.data);
  if (!parsed.success) throw new RestContractViolation(parsed.error.issues);
  return parsed.data.data;
}

export function useMediaPruneMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: pruneMedia,
    // Pruning changes the media stats the same screen renders.
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: MEDIA_STATS_QUERY_KEY });
    },
  });
}
