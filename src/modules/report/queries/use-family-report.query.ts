'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import {
  familyReportDetailSchema,
  familyReportListSchema,
} from '@/modules/report/schemas/family-report.schema';
import type { FamilyReportDetail, FamilyReportListRow } from '@/modules/report/schemas/family-report.schema';

/**
 * C-PAR-REPORT (NIGHT-2 W8, JF-039) — the PARENT family-report reads:
 * - GET /api/my/results/:documentId → one family report (released allow-list
 *   view, or the held/recalled lifecycle face).
 * - GET /api/my/results             → the parent reports list (per child,
 *   with the release state and dates).
 * Both answers are parsed strictly — the API owns the allow-list; this parse
 * is the second line, not the only one.
 */
async function fetchFamilyReport(resultDocumentId: string): Promise<FamilyReportDetail> {
  const response = await strapi.get(`/api/my/results/${resultDocumentId}`);
  return familyReportDetailSchema.parse(response.data);
}

export function useFamilyReportQuery(resultDocumentId: string) {
  return useQuery({
    queryKey: ['report', 'family', resultDocumentId],
    queryFn: () => fetchFamilyReport(resultDocumentId),
    enabled: Boolean(resultDocumentId),
    staleTime: 0,
    retry: false,
  });
}

async function fetchFamilyReportList(): Promise<FamilyReportListRow[]> {
  const response = await strapi.get('/api/my/results');
  return familyReportListSchema.parse(response.data);
}

export function useFamilyReportListQuery(enabled = true) {
  return useQuery({
    queryKey: ['report', 'family-list'],
    queryFn: fetchFamilyReportList,
    enabled,
    staleTime: 0,
    retry: false,
  });
}
