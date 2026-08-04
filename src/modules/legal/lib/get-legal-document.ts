import { env } from '@/lib/env';
import {
  legalDocumentListResponseSchema,
  legalDocumentResponseSchema,
} from '@/modules/legal/schemas/legal-document.schema';
import { LEGAL_CACHE_TAG } from '@/modules/legal/constants/legal.constants';
import type { LegalDocument, LegalDocumentSummary, LegalSlug } from '@/modules/legal/types/legal.types';
import { LEGAL_PATH } from '@/modules/legal/constants/lib.constants';

/**
 * C-LEG-02 — one legal document, parsed through the shared schema. Returns null
 * ONLY for a real 404; any other failure throws so a broken backend surfaces as
 * an error page instead of an empty policy.
 */
export async function getLegalDocument(
  slug: LegalSlug,
  locale: string,
): Promise<LegalDocument | null> {
  const url = `${env.API_BASE_URL}${LEGAL_PATH}/${slug}?locale=${encodeURIComponent(locale)}`;
  const res = await fetch(url, { next: { tags: [LEGAL_CACHE_TAG], revalidate: 300 } });

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`[legal] GET ${LEGAL_PATH}/${slug} failed with ${res.status}`);
  }
  return legalDocumentResponseSchema.parse(await res.json()).data;
}

/** C-LEG-01 — the published document index (sitemap, llms.txt, footer links). */
export async function getLegalDocuments(locale: string): Promise<LegalDocumentSummary[]> {
  const url = `${env.API_BASE_URL}${LEGAL_PATH}?locale=${encodeURIComponent(locale)}`;
  const res = await fetch(url, { next: { tags: [LEGAL_CACHE_TAG], revalidate: 300 } });

  if (!res.ok) throw new Error(`[legal] GET ${LEGAL_PATH} failed with ${res.status}`);
  return legalDocumentListResponseSchema.parse(await res.json()).data;
}
