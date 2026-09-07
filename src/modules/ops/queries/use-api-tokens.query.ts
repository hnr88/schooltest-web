'use client';

import { useQuery } from '@tanstack/react-query';
import {
  ApiTokensOperation,
  RestContractViolation,
  apiTokensResponseSchema,
  type ApiTokensResponse,
} from '@schooltest/ops-contracts';

import { strapi } from '@/lib/axios/strapi';

/**
 * Co-located with its query (the use-school-activity.query.ts precedent) rather
 * than added to the shared queries.constants.ts: only this read and its revoke
 * mutation use it.
 */
export const OPS_API_TOKENS_QUERY_KEY = ['ops', 'api-tokens'] as const;

// C-OPSA-02 — the API-token inventory behind the Audit console.
//
// The server projects `accessKey` away and the contract refuses to model it, so
// a drift that starts returning the hashed secret fails here instead of
// painting a credential on an ops screen. The route serves no pagination: it is
// the whole (small) token list by design.
async function fetchApiTokens(signal: AbortSignal): Promise<ApiTokensResponse> {
  const res = await strapi.get<unknown>(ApiTokensOperation.path, { signal });
  const parsed = apiTokensResponseSchema.safeParse(res.data);
  if (!parsed.success) throw new RestContractViolation(parsed.error.issues);
  return parsed.data;
}

export function useApiTokensQuery(enabled: boolean) {
  return useQuery({
    queryKey: OPS_API_TOKENS_QUERY_KEY,
    queryFn: ({ signal }) => fetchApiTokens(signal),
    enabled,
    staleTime: 0,
    retry: false,
  });
}
