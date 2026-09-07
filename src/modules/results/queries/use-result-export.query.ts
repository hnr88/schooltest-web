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
 * WIRING MARK (task 29 running early): the schema is the TARGET v2 bundle; the
 * live export route still emits the v1 markdown/legacy bundle until task 25 —
 * this parse fails against today's response by design. Screen C part 3 (task
 * 32) wires the Ask AI flow up after 25; nothing imports this hook yet.
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
