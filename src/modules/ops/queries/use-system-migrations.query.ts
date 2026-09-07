'use client';

import { useQuery } from '@tanstack/react-query';

import { systemMigrationsSchema, type SystemMigrations } from '@schooltest/ops-contracts';

import { parseDataEnvelope, strapi } from '@/lib/axios/strapi';
import { SYSTEM_MIGRATIONS_QUERY_KEY } from '@/modules/ops/constants/queries.constants';

/**
 * Ledger row 5b — C-OPSY-10 GET /api/ops/system/migrations, ops only.
 *
 * The applied user-migration ledger (name + applied-at, newest first as the
 * server orders them) with the server's own count beside it, parsed through
 * the shared contract schema.
 */
async function fetchSystemMigrations(signal: AbortSignal): Promise<SystemMigrations> {
  const res = await strapi.get<unknown>('/api/ops/system/migrations', {
    opsPortalVersioned: true,
    signal,
  });
  return parseDataEnvelope(systemMigrationsSchema, res.data);
}

export function useSystemMigrationsQuery(enabled = true) {
  return useQuery({
    queryKey: SYSTEM_MIGRATIONS_QUERY_KEY,
    queryFn: ({ signal }) => fetchSystemMigrations(signal),
    enabled,
    retry: false,
    // Migrations only change when a deploy runs — re-read on every mount so a
    // freshly deployed schema state is never stale.
    staleTime: 0,
    refetchOnMount: 'always',
  });
}
