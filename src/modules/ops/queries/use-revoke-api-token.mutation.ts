'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  RestContractViolation,
  apiTokenRevokePath,
  apiTokenRevokeResponseSchema,
} from '@schooltest/ops-contracts';

import { strapi } from '@/lib/axios/strapi';
import { OPS_API_TOKENS_QUERY_KEY } from '@/modules/ops/queries/use-api-tokens.query';

// C-OPSA-02 — revoke one API token.
//
// This is IRREVERSIBLE: the server hard-deletes the row, so there is no
// un-revoke and the UI must confirm before calling. The operation takes no
// body; a versioned request is not used because this route has one shape.
async function revokeApiToken(id: number) {
  const res = await strapi.post<unknown>(apiTokenRevokePath(id), undefined);
  const parsed = apiTokenRevokeResponseSchema.safeParse(res.data);
  if (!parsed.success) throw new RestContractViolation(parsed.error.issues);
  return parsed.data.data;
}

export function useRevokeApiTokenMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revokeApiToken,
    // Two caches move: the token list loses a row, and the ledger GAINS one —
    // the server writes a `security.api_token_revoke` audit entry, so the table
    // on the same screen must refetch or it would show a stale history.
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: OPS_API_TOKENS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ['ops', 'audit-logs'] }),
      ]);
    },
  });
}
