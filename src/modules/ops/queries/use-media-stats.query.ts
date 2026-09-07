'use client';

import { useQuery } from '@tanstack/react-query';
import { mediaStatsSchema, type MediaStats } from '@schooltest/ops-contracts';

import { parseDataEnvelope, strapi } from '@/lib/axios/strapi';
import { MEDIA_STATS_QUERY_KEY } from '@/modules/ops/constants/queries.constants';

/**
 * Ledger row 8a — C-OPSC-04 GET /api/ops/media/stats, ops only.
 *
 * Real byte totals from the upload plugin's own file table (size stored in
 * kilobytes, normalised to bytes by the server), parsed through the shared
 * contract schema.
 */
async function fetchMediaStats(signal: AbortSignal): Promise<MediaStats> {
  const res = await strapi.get<unknown>('/api/ops/media/stats', {
    opsPortalVersioned: true,
    signal,
  });
  const parsed = parseDataEnvelope(mediaStatsSchema, res.data);
  return parsed;
}

export function useMediaStatsQuery(enabled = true) {
  return useQuery({
    queryKey: MEDIA_STATS_QUERY_KEY,
    queryFn: ({ signal }) => fetchMediaStats(signal),
    enabled,
    retry: false,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}
