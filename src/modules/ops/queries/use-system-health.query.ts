'use client';

import { useQuery } from '@tanstack/react-query';

import { systemHealthSchema, type SystemHealth } from '@schooltest/ops-contracts';

import { parseDataEnvelope, strapi } from '@/lib/axios/strapi';
import { SYSTEM_HEALTH_QUERY_KEY } from '@/modules/ops/constants/queries.constants';

/**
 * Ledger row 5b — C-OPSY-06 GET /api/ops/system/health, ops only.
 *
 * The ONE fetcher for the console's health tiles. The body is parsed through
 * the SHARED `@schooltest/ops-contracts` schema (the same module the server
 * was written against), so a shape the server never promised cannot reach the
 * screen. Five real probes plus the server's own `overall` roll-up render as
 * they come — a down probe is a real state on this stack, never smoothed over.
 */
async function fetchSystemHealth(signal: AbortSignal): Promise<SystemHealth> {
  const res = await strapi.get<unknown>('/api/ops/system/health', {
    opsPortalVersioned: true,
    signal,
  });
  return parseDataEnvelope(systemHealthSchema, res.data);
}

export function useSystemHealthQuery(enabled = true) {
  return useQuery({
    queryKey: SYSTEM_HEALTH_QUERY_KEY,
    queryFn: ({ signal }) => fetchSystemHealth(signal),
    enabled,
    // A failed health read is shown, never retried behind the operator's back:
    // the screen offers an explicit retry so a 403 (wrong role) is not
    // mistaken for a slow load.
    retry: false,
    // Health is the one surface whose whole point is "what is true NOW".
    staleTime: 0,
    refetchOnMount: 'always',
  });
}
