'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  RestContractViolation,
  systemBackupRunResponseSchema,
} from '@schooltest/ops-contracts';

import { strapi } from '@/lib/axios/strapi';
import { SYSTEM_BACKUPS_QUERY_KEY } from '@/modules/ops/constants/queries.constants';

/**
 * Ledger row 5c — C-OPSY-03 POST /api/ops/system/backup.
 *
 * Runs a real pg_dump (host binary, falling back to the compose container) and
 * records the ledger row WHATEVER the outcome — a failed run is recorded as
 * `failed` with the real error, never swallowed. The UI surfaces the server's
 * own result; there is no fake success.
 */
async function runSystemBackup() {
  const res = await strapi.post<unknown>('/api/ops/system/backup', {});
  const parsed = systemBackupRunResponseSchema.safeParse(res.data);
  if (!parsed.success) throw new RestContractViolation(parsed.error.issues);
  return parsed.data.data;
}

export function useSystemBackupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: runSystemBackup,
    // The run writes its ledger row, so the backups table on the same screen
    // must refetch or it would not show the run that just happened.
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: SYSTEM_BACKUPS_QUERY_KEY });
    },
  });
}
