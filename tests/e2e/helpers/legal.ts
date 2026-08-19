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

/** Ops JWT from the seeded ops account — minted live, never stored in the repo. */
async function opsJwt(): Promise<string> {
  const identifier = process.env.E2E_OPS_EMAIL ?? 'admin@schooltest.local';
  const password = process.env.E2E_OPS_PASSWORD ?? 'Admin1234!';
  const res = await fetch(`${API_BASE_URL}/api/auth/local`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });
  if (!res.ok) throw new Error(`[e2e] ops login failed with ${res.status}`);
  return ((await res.json()) as { jwt: string }).jwt;
}

/** Edit a legal document through the REAL C-LEG-03 write path. */
export async function opsUpdateLegal(
  slug: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/ops/legal-documents/${slug}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await opsJwt()}` },
    body: JSON.stringify(patch),
  });
  if (res.status !== 200) throw new Error(`[e2e] ops legal update failed with ${res.status}`);
}

/**
 * Publish a legal change immediately through C-WEB-04. `revalidateTag` is
 * stale-while-revalidate, so the first read after it still serves stale and
 * triggers the refresh — callers reload once before asserting.
 */
export async function revalidateLegal(): Promise<void> {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) throw new Error('[e2e] REVALIDATE_SECRET is not set');
  const base = process.env.E2E_BASE_URL ?? 'http://localhost:3101';
  const res = await fetch(`${base}/api/revalidate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-revalidate-secret': secret },
    body: JSON.stringify({ tags: ['legal-documents'] }),
  });
  if (!res.ok) throw new Error(`[e2e] revalidate failed with ${res.status}`);
}
