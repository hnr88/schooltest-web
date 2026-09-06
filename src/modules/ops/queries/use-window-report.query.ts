'use client';

import { useQuery } from '@tanstack/react-query';

import {
  windowReportResponseSchema,
  type WindowReportResponse,
} from '@schooltest/ops-contracts';

import { strapi } from '@/lib/axios/strapi';

/**
 * Task 29 — C-OPS-PORTAL-055: one window's report, parsed through the shared
 * contract. No hook existed for this endpoint; this is the first consumer (no
 * duplicate to consolidate). Whole-window totals travel on every page.
 */
export function windowReportQueryKey(
  schoolDocumentId: string,
  windowDocumentId: string,
  page: number
) {
  return ['ops', 'schools', schoolDocumentId, 'result-windows', windowDocumentId, 'report', page] as const;
}

async function fetchWindowReport(
  schoolDocumentId: string,
  windowDocumentId: string,
  page: number
): Promise<WindowReportResponse> {
  const res = await strapi.get<unknown>(
    `/api/ops/schools/${schoolDocumentId}/result-windows/${windowDocumentId}/report?page=${page}&pageSize=25`,
    { opsPortalVersioned: true }
  );
  return windowReportResponseSchema.parse(res.data);
}

export function useWindowReportQuery(
  schoolDocumentId: string,
  windowDocumentId: string,
  enabled = true
) {
  const page = 1;
  return useQuery({
    queryKey: windowReportQueryKey(schoolDocumentId, windowDocumentId, page),
    queryFn: () => fetchWindowReport(schoolDocumentId, windowDocumentId, page),
    enabled: Boolean(schoolDocumentId) && Boolean(windowDocumentId) && enabled,
    retry: false,
  });
}
