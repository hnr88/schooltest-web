'use client';

import { useQuery } from '@tanstack/react-query';
import {
  OpsFlagsOperation,
  RestContractViolation,
  flagsResponseSchema,
  type FlagsResponse,
} from '@schooltest/ops-contracts';

import { strapi } from '@/lib/axios/strapi';
import { OPS_FLAGS_QUERY_KEY } from '@/modules/ops/constants/queries.constants';

// C-OPSF-01 — the feature-flag registry.
//
// The server owns the list: `KNOWN_FLAG_KEYS` in the API is a CLOSED registry
// and an unknown key is a 400 that enumerates the known ones. So this read is
// the only source of keys the console offers — nothing here hard-codes a flag,
// and a flag shipped by a later API release renders without a web change.
//
// `staleTime: 0` because a toggle elsewhere (another operator, another tab)
// changes the answer, and a stale switch position is a lie about platform
// state rather than a cosmetic delay.
async function fetchOpsFlags(signal: AbortSignal): Promise<FlagsResponse> {
  const res = await strapi.get<unknown>(OpsFlagsOperation.path, { signal });
  const parsed = flagsResponseSchema.safeParse(res.data);
  if (!parsed.success) throw new RestContractViolation(parsed.error.issues);
  return parsed.data;
}

export function useOpsFlagsQuery(enabled: boolean) {
  return useQuery({
    queryKey: OPS_FLAGS_QUERY_KEY,
    queryFn: ({ signal }) => fetchOpsFlags(signal),
    enabled,
    staleTime: 0,
    retry: false,
  });
}
