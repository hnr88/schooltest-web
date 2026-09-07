'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  RestContractViolation,
  contentReindexResponseSchema,
  maintenanceActionRequestSchema,
} from '@schooltest/ops-contracts';

import { strapi } from '@/lib/axios/strapi';
import { CONTENT_COUNTS_QUERY_KEY } from '@/modules/ops/constants/queries.constants';

/**
 * Ledger row 8c — C-OPSC-06 POST /api/ops/content/reindex-search.
 *
 * DRIFT-6 contract (landed in the api): an absent/omitted `dryRun` is a
 * DRY-RUN report only — counts, no audit write. The pass EXECUTES (and writes
 * its audit row) only when the caller sends `dryRun: false` explicitly. The
 * UI's confirm dialog is that explicit confirmation, and it MUST send the
 * flag; the response echoes which happened.
 */
async function reindexSearch(input: { dryRun?: boolean }) {
  const parsedInput = maintenanceActionRequestSchema.safeParse(input);
  if (!parsedInput.success) throw new RestContractViolation(parsedInput.error.issues);
  const res = await strapi.post<unknown>('/api/ops/content/reindex-search', parsedInput.data);
  const parsed = contentReindexResponseSchema.safeParse(res.data);
  if (!parsed.success) throw new RestContractViolation(parsed.error.issues);
  return parsed.data.data;
}

export function useContentReindexMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reindexSearch,
    // The pass verifies searchable-column integrity over the school table —
    // counts cannot change, but refetching keeps the tiles honest anyway.
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CONTENT_COUNTS_QUERY_KEY });
    },
  });
}
