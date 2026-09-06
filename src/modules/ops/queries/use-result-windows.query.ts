'use client';

import { useQuery } from '@tanstack/react-query';

import {
  opsResultWindowsQuerySchema,
  opsResultWindowsResponseSchema,
  type OpsResultWindowsQuery,
  type OpsResultWindowsResponse,
} from '@schooltest/ops-contracts';

import { strapi } from '@/lib/axios/strapi';

/**
 * C-OPS-PORTAL-054 — GET /api/ops/schools/{documentId}/result-windows
 * (task 28, D-WIN). No hook existed for this endpoint, so there is no
 * duplicate to consolidate: this is the first consumer.
 *
 * The response is PARSED, not cast: a server that starts returning a shape the
 * contract never promised fails here, loudly, instead of rendering undefined
 * cells. The query is validated against the shared request schema before it is
 * encoded, so a malformed caller state is caught client-side with the same
 * bounds the server enforces.
 */
export function resultWindowsQueryKey(schoolDocumentId: string, query: OpsResultWindowsQuery) {
  return ['ops', 'schools', schoolDocumentId, 'result-windows', query] as const;
}

export function resultWindowsQueryString(query: OpsResultWindowsQuery): string {
  const pairs: [string, string][] = [];
  if (query.page !== undefined) pairs.push(['page', String(query.page)]);
  if (query.pageSize !== undefined) pairs.push(['pageSize', String(query.pageSize)]);
  if (query.status !== undefined) pairs.push(['status', query.status]);
  return pairs
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}

async function fetchResultWindows(
  schoolDocumentId: string,
  query: OpsResultWindowsQuery
): Promise<OpsResultWindowsResponse> {
  const validated = opsResultWindowsQuerySchema.parse(query);
  const search = resultWindowsQueryString(validated);
  const res = await strapi.get<unknown>(
    `/api/ops/schools/${schoolDocumentId}/result-windows${search === '' ? '' : `?${search}`}`,
    { opsPortalVersioned: true }
  );
  return opsResultWindowsResponseSchema.parse(res.data);
}

export function useResultWindowsQuery(
  schoolDocumentId: string,
  query: OpsResultWindowsQuery = {},
  enabled = true
) {
  return useQuery({
    queryKey: resultWindowsQueryKey(schoolDocumentId, query),
    queryFn: () => fetchResultWindows(schoolDocumentId, query),
    enabled: Boolean(schoolDocumentId) && enabled,
    retry: false,
  });
}
