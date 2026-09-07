'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CommsBulkEmailOperation,
  RestContractViolation,
  bulkEmailResponseSchema,
  type BulkEmailBody,
  type BulkEmailResult,
} from '@schooltest/ops-contracts';

import { strapi } from '@/lib/axios/strapi';

// C-OPSM-01 — the bulk email fan-out.
//
// `dryRun` is ALWAYS sent explicitly. The server treats a missing flag as TRUE
// (`body.dryRun !== false`), so relying on the default would work today and
// break silently the day that line changes — and the failure mode is mail
// leaving the building. A dry run resolves the audience and reports the true
// recipient count without sending, which is exactly the preview the composer
// shows before it asks for confirmation.
//
// This is NOT reversible once `dryRun: false`: the server iterates the resolved
// addresses and sends. The caller must confirm first.
async function sendBulkEmail(body: BulkEmailBody): Promise<BulkEmailResult> {
  const res = await strapi.post<unknown>(CommsBulkEmailOperation.path, body);
  const parsed = bulkEmailResponseSchema.safeParse(res.data);
  if (!parsed.success) throw new RestContractViolation(parsed.error.issues);
  return parsed.data.data;
}

export function useBulkEmailMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sendBulkEmail,
    // A REAL send writes a `comms.bulk_email` audit entry; a dry run writes
    // nothing. Only invalidate the ledger when something actually happened, so
    // a preview does not churn another console's cache.
    //
    // The email log is deliberately NOT invalidated: it reads the auth-email
    // issuance table, which a bulk send does not touch.
    onSuccess: async (result) => {
      if (result.dryRun) return;
      await queryClient.invalidateQueries({ queryKey: ['ops', 'audit-logs'] });
    },
  });
}
