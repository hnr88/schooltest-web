'use client';

import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { orphanKindReportSchema, type OrphanKindReport } from '@schooltest/ops-contracts';

import { parseDataEnvelope, strapi } from '@/lib/axios/strapi';
import { CONTENT_ORPHANS_QUERY_KEY } from '@/modules/ops/constants/queries.constants';

/**
 * Ledger row 8b — C-OPSC-02 GET /api/ops/content/orphans, ops only.
 *
 * Per-kind orphan reports (count + a 20-documentId sample), parsed through
 * the shared contract schema. The purge control lives beside this table and
 * invalidates it after it runs.
 */
async function fetchContentOrphans(signal: AbortSignal): Promise<OrphanKindReport[]> {
  const res = await strapi.get<unknown>('/api/ops/content/orphans', {
    opsPortalVersioned: true,
    signal,
  });
  return parseDataEnvelope(z.array(orphanKindReportSchema), res.data);
}

export function useContentOrphansQuery(enabled = true) {
  return useQuery({
    queryKey: CONTENT_ORPHANS_QUERY_KEY,
    queryFn: ({ signal }) => fetchContentOrphans(signal),
    enabled,
    retry: false,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}
