/**
 * Platform-settings e2e helpers (mission task 228). Every call goes to the
 * running API through the real contracted endpoints; the DB is read with psql.
 */
import { runSql } from './auth-db';

export { runSql };

const API_BASE_URL =
  process.env.E2E_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:5500';

const OPS = {
  email: process.env.E2E_OPS_EMAIL ?? 'admin@schooltest.local',
  password: process.env.E2E_OPS_PASSWORD ?? 'TBUaS2yS6D9FJMZP!A1',
};

export interface HttpResult {
  status: number;
  body: unknown;
}


/**
 * The JWT is minted ONCE per worker. The API's brute-force guard allows 20
 * logins per minute per IP, and a helper that logs in on every call blows
 * through that in one spec — which surfaced as a bogus 429 mid-suite, not as a
 * product defect.
 */
let cachedJwt: string | null = null;

async function opsJwt(): Promise<string> {
  if (cachedJwt) return cachedJwt;
  const res = await fetch(`${API_BASE_URL}/api/auth/local`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: OPS.email, password: OPS.password }),
  });
  if (!res.ok) throw new Error(`[e2e] ops login failed: ${res.status}`);
  cachedJwt = ((await res.json()) as { jwt: string }).jwt;
  return cachedJwt;
}

export interface OpsSettings {
  site_name: string;
  site_tagline: string | null;
  session_timeout_minutes: number;
  upload_max_size_mb: number;
  pagination_default_page_size: number;
  pagination_max_page_size: number;
}

/** C-SET-02 — the full ops read. */
export async function opsReadSettings(): Promise<OpsSettings> {
  const res = await fetch(`${API_BASE_URL}/api/platform-settings`, {
    headers: { Authorization: `Bearer ${await opsJwt()}` },
  });
  if (!res.ok) throw new Error(`[e2e] settings read failed: ${res.status}`);
  return ((await res.json()) as { data: OpsSettings }).data;
}

/**
 * C-SET-03 — the ops write. Throws on an unexpected failure so a broken write
 * cannot be mistaken for a passing test; pass `expectFailure` when the refusal
 * IS the assertion.
 */
export async function opsUpdateSettings(
  patch: Record<string, unknown>,
  options: { expectFailure?: boolean } = {},
): Promise<HttpResult> {
  const res = await fetch(`${API_BASE_URL}/api/platform-settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await opsJwt()}` },
    body: JSON.stringify(patch),
  });
  const body = await res.json().catch(() => null);
  if (!options.expectFailure && res.status !== 200) {
    throw new Error(`[e2e] settings update failed: ${res.status} ${JSON.stringify(body)}`);
  }
  return { status: res.status, body };
}

/** C-SET-01 — the anonymous public projection. */
export async function publicSettings(): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_BASE_URL}/api/platform-settings/public`);
  if (!res.ok) throw new Error(`[e2e] public settings failed: ${res.status}`);
  return ((await res.json()) as { data: Record<string, unknown> }).data;
}

/** C-SET-04 — send a real test message. */
export async function sendTestEmail(to: string): Promise<HttpResult> {
  const res = await fetch(`${API_BASE_URL}/api/ops/system/test-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await opsJwt()}` },
    body: JSON.stringify({ to }),
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

/**
 * Publish a settings change to the Next cache through C-WEB-04. `revalidateTag`
 * is stale-while-revalidate, so a warm-up request is issued and callers reload
 * once before asserting.
 */
export async function revalidateSettings(): Promise<void> {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) throw new Error('[e2e] REVALIDATE_SECRET is not set');
  const base = process.env.E2E_BASE_URL ?? 'http://localhost:3101';
  const res = await fetch(`${base}/api/revalidate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-revalidate-secret': secret },
    body: JSON.stringify({ tags: ['platform-settings'] }),
  });
  if (!res.ok) throw new Error(`[e2e] revalidate failed: ${res.status}`);
  await fetch(`${base}/`).catch(() => undefined);
}
