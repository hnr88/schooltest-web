'use client';

import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { contentCountRowSchema, type ContentCountRow } from '@schooltest/ops-contracts';

import { parseDataEnvelope, strapi } from '@/lib/axios/strapi';
import { CONTENT_COUNTS_QUERY_KEY } from '@/modules/ops/constants/queries.constants';

/**
 * Ledger row 8a — C-OPSC-01 GET /api/ops/content/counts, ops only.
 *
 * The live row-count enumeration of every api:: content type, parsed through
 * the shared contract schema.
 */
async function fetchContentCounts(signal: AbortSignal): Promise<ContentCountRow[]> {
  const res = await strapi.get<unknown>('/api/ops/content/counts', {
    opsPortalVersioned: true,
    signal,
  });
  return parseDataEnvelope(z.array(contentCountRowSchema), res.data);
}

export function useContentCountsQuery(enabled = true) {
  return useQuery({
    queryKey: CONTENT_COUNTS_QUERY_KEY,
    queryFn: ({ signal }) => fetchContentCounts(signal),
    enabled,
    retry: false,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}
