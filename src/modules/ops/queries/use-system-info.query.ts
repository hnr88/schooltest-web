'use client';

import { useQuery } from '@tanstack/react-query';

import { systemInfoSchema, type SystemInfo } from '@schooltest/ops-contracts';

import { parseDataEnvelope, strapi } from '@/lib/axios/strapi';
import { SYSTEM_INFO_QUERY_KEY } from '@/modules/ops/constants/queries.constants';

/**
 * Ledger row 5b — C-OPSY-07 GET /api/ops/system/info, ops only.
 *
 * Versions and uptime ONLY — the server deliberately never sends a secret or a
 * connection string, and the shared schema pins that shape so a future field
 * cannot silently appear (or disappear) without the contract moving first.
 */
async function fetchSystemInfo(signal: AbortSignal): Promise<SystemInfo> {
  const res = await strapi.get<unknown>('/api/ops/system/info', {
    opsPortalVersioned: true,
    signal,
  });
  return parseDataEnvelope(systemInfoSchema, res.data);
}

export function useSystemInfoQuery(enabled = true) {
  return useQuery({
    queryKey: SYSTEM_INFO_QUERY_KEY,
    queryFn: ({ signal }) => fetchSystemInfo(signal),
    enabled,
    retry: false,
    // Info changes outside this tab (a deploy, a restart) — every mount re-reads.
    staleTime: 0,
    refetchOnMount: 'always',
  });
}
