'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  RestContractViolation,
  orphanPurgeRequestSchema,
  orphanPurgeResponseSchema,
} from '@schooltest/ops-contracts';

import { strapi } from '@/lib/axios/strapi';
import { CONTENT_ORPHANS_QUERY_KEY } from '@/modules/ops/constants/queries.constants';

/**
 * Ledger row 8b — C-OPSC-03 POST /api/ops/content/orphans/purge.
 *
 * DESTRUCTIVE: with `dryRun: false` the server DELETES the orphan rows of the
 * requested kinds. The server defaults `dryRun` to true — the UI must send
 * `dryRun: false` EXPLICITLY behind the confirm dialog, and the response
 * echoes the flag so the screen can show which happened.
 */
async function purgeOrphans(input: orphanPurgeRequestSchema_input) {
  const parsedInput = orphanPurgeRequestSchema.safeParse(input);
  if (!parsedInput.success) throw new RestContractViolation(parsedInput.error.issues);
  const res = await strapi.post<unknown>('/api/ops/content/orphans/purge', parsedInput.data);
  const parsed = orphanPurgeResponseSchema.safeParse(res.data);
  if (!parsed.success) throw new RestContractViolation(parsed.error.issues);
  return parsed.data.data;
}

type orphanPurgeRequestSchema_input = {
  kinds: string[];
  dryRun?: boolean;
};

export function useOrphanPurgeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: purgeOrphans,
    // The purge changes exactly what the orphans table reports.
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CONTENT_ORPHANS_QUERY_KEY });
    },
  });
}
