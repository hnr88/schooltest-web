'use client';

import { useQuery } from '@tanstack/react-query';

import { opsBackupRecordSchema, type OpsBackupRecord } from '@schooltest/ops-contracts';

import { parseDataEnvelope, strapi } from '@/lib/axios/strapi';
import { SYSTEM_BACKUPS_QUERY_KEY } from '@/modules/ops/constants/queries.constants';

/**
 * Ledger row 5b — C-OPSY-04 GET /api/ops/system/backups, ops only.
 *
 * The recorded backup ledger, newest first (the server sorts started_at desc
 * and caps at 50). An empty array is the honest fresh-database state — the
 * screen renders a real empty state, never a fabricated row. The backup RUN
 * action is ledger slice 5c, deliberately absent here.
 */
async function fetchSystemBackups(signal: AbortSignal): Promise<OpsBackupRecord[]> {
  const res = await strapi.get<unknown>('/api/ops/system/backups', {
    opsPortalVersioned: true,
    signal,
  });
  return parseDataEnvelope(opsBackupRecordSchema.array(), res.data);
}

export function useSystemBackupsQuery(enabled = true) {
  return useQuery({
    queryKey: SYSTEM_BACKUPS_QUERY_KEY,
    queryFn: ({ signal }) => fetchSystemBackups(signal),
    enabled,
    retry: false,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}
