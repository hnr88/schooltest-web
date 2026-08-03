/**
 * Legal-surface e2e helpers (mission task 207). The page list, a live C-LEG-02
 * read so expectations come from the REAL API rather than a fixture, and the
 * Postgres probe re-exported from the shared auth-db helper.
 */
import { runSql } from './auth-db';

export { runSql };

/** Where the API is: the same base URL the Next server reads from. */
const API_BASE_URL =
  process.env.E2E_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:5500';

export interface LegalPage {
  readonly slug: string;
  readonly path: string;
  /** Flattened catalog key for the link label (Navigation namespace). */
  readonly labelKey: string;
}

export const LEGAL_PAGES: readonly LegalPage[] = [
  { slug: 'privacy-policy', path: '/privacy-policy', labelKey: 'Navigation.privacyPolicy' },
  { slug: 'terms-of-service', path: '/terms-of-service', labelKey: 'Navigation.termsOfService' },
  { slug: 'cookie-policy', path: '/cookie-policy', labelKey: 'Navigation.cookiePolicy' },
  { slug: 'gdpr', path: '/gdpr', labelKey: 'Navigation.gdpr' },
];

export interface LegalSection {
  id: string;
  heading: string;
  paragraphs: string[];
  list?: string[];
}

export interface LegalDocument {
  documentId: string;
  slug: string;
  title: string;
  summary: string | null;
  version: string;
  effective_date: string;
  locale_code: string;
  sections: LegalSection[];
}

/** Read a document straight from the running API (C-LEG-02) — never a fixture. */
export async function fetchLegalDocument(slug: string, locale = 'en'): Promise<LegalDocument> {
  const res = await fetch(`${API_BASE_URL}/api/legal-documents/${slug}?locale=${locale}`);
  if (!res.ok) {
    throw new Error(`[e2e] GET /api/legal-documents/${slug} failed with ${res.status}`);
  }
  const body = (await res.json()) as { data: LegalDocument };
  return body.data;
}
