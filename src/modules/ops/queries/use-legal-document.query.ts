'use client';

import { useQuery } from '@tanstack/react-query';
import {
  legalDocumentDetailSchema,
  legalDocumentReadPath,
  type LegalDocumentDetail,
  type LegalSlug,
} from '@schooltest/ops-contracts';

import { parseDataEnvelope, strapi } from '@/lib/axios/strapi';

/**
 * Ledger 10 (D-008) — C-LEG-02 hydration read for the legal-document editor.
 *
 * The route is PUBLIC (auth is false by design), so the editor hydrates from
 * the same bytes the public page renders — an operator sees exactly what a
 * visitor sees before saving. The key lives in THIS file rather than the
 * shared queries.constants.ts: that file is mid-edit by another worker on the
 * shared staging checkout, and a key is this slice's own concern.
 */
export const LEGAL_DOCUMENT_QUERY_KEY = (slug: LegalSlug) =>
  ['ops', 'legal-document', slug] as const;

async function fetchLegalDocument(
  slug: LegalSlug,
  signal: AbortSignal,
): Promise<LegalDocumentDetail> {
  const res = await strapi.get<unknown>(legalDocumentReadPath(slug), { signal });
  return parseDataEnvelope(legalDocumentDetailSchema, res.data);
}

export function useLegalDocumentQuery(slug: LegalSlug, enabled = true) {
  return useQuery({
    queryKey: LEGAL_DOCUMENT_QUERY_KEY(slug),
    queryFn: ({ signal }) => fetchLegalDocument(slug, signal),
    enabled,
    retry: false,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}
