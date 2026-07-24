'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import {
  DIAGNOSTIC_JSON_FORMAT,
  diagnosticBundleSchema,
} from '@/modules/report/schemas/diagnostic-bundle.schema';
import type { DiagnosticBundle } from '@/modules/report/types/error-pattern.types';

// C-5: GET /api/results/:documentId/export?format=diagnostic_json answers a BARE
// DiagnosticBundle (no {data, meta}). The action is granted to teacher + admin
// only, and ownership — teacher own-students, OFFICIAL results only — is the
// server's job, so the portal never filters and never retries a 403/404.
async function fetchDiagnosticBundle(documentId: string): Promise<DiagnosticBundle> {
  const response = await strapi.get(`/api/results/${documentId}/export`, {
    params: { format: DIAGNOSTIC_JSON_FORMAT },
  });
  return diagnosticBundleSchema.parse(response.data);
}

export function useDiagnosticBundleQuery(documentId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['report', 'diagnostic-bundle', documentId],
    queryFn: () => fetchDiagnosticBundle(documentId),
    enabled: enabled && Boolean(documentId),
    staleTime: 0,
    retry: false,
  });
}
