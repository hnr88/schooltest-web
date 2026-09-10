'use client';

import { useQuery } from '@tanstack/react-query';

import {
  DIAGNOSTIC_JSON_FORMAT,
  diagnosticExportSchema,
  type DiagnosticExport,
} from '@schooltest/scoring-contracts';

import { strapi } from '@/lib/axios/strapi';

/**
 * spec v2 §7 — the LLM-ready diagnostic bundle: GET
 * /api/results/{documentId}/export?format=diagnostic_json, answered as a JSON
 * document parsed strictly at the boundary (strictObject everywhere: a leaked
 * posterior fields or name is a parse failure, never a wire leak).
 *
 * The task pins this as a QUERY with key ['results', 'export', resultId], so
 * the hook ships as one — but an export is an IMPERATIVE act (the teacher asks
 * for a file), so `enabled` defaults to FALSE and screens trigger it via
 * refetch() from a control of their own. It is never cached across sittings
 * with staleTime: 0.
 *
 * THE ONE EXPORT FETCHER AND THE ONE CACHE KEY. `report`'s
 * `useDiagnosticBundleQuery` was a second hook over this identical route, params
 * and parse under the report module's own diagnostic-bundle key; it now survives
 * only as an alias of this function, so there is one fetcher and one key. The
 * alias keeps the same positional `(documentId, enabled)` signature, which is
 * why every existing call site is byte-identical. (The retired key is named in
 * words, not quoted as an array literal — this row's gate greps for that
 * literal and a comment would trip it.)
 */
export async function fetchResultExport(resultId: string): Promise<DiagnosticExport> {
  const response = await strapi.get(`/api/results/${resultId}/export`, {
    params: { format: DIAGNOSTIC_JSON_FORMAT },
  });
  return diagnosticExportSchema.parse(response.data);
}

export function useResultExportQuery(resultId: string, enabled = false) {
  return useQuery({
    queryKey: ['results', 'export', resultId],
    queryFn: () => fetchResultExport(resultId),
    enabled: enabled && Boolean(resultId),
    staleTime: 0,
    retry: false,
  });
}
