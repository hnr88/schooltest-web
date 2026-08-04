/**
 * Ops school onboarding e2e helpers (mission st-ops-onboarding).
 *
 * Everything is real: fixture schools are created through the ops contract,
 * statuses come out of Postgres with the suite's psql helper, and magic links
 * are read from the running Mailpit. Nothing is mocked and no row is inserted
 * behind the API's back.
 */
const API_BASE_URL =
  process.env.E2E_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:5500';

const OPS = {
  email: process.env.E2E_OPS_EMAIL ?? 'admin@schooltest.local',
  password: process.env.E2E_OPS_PASSWORD ?? 'TBUaS2yS6D9FJMZP!A1',
};

/**
 * The ops JWT is minted ONCE per worker: the API allows 20 logins per minute per
 * IP, and a helper that logs in per call blows through that mid-suite (the
 * settings-helper precedent).
 */
let cachedJwt: string | null = null;

export async function opsJwt(): Promise<string> {
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

export interface ApiResult<T> {
  status: number;
  body: T;
}

async function opsFetch<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${await opsJwt()}`,
      ...(init?.headers ?? {}),
    },
  });
  return { status: res.status, body: (await res.json()) as T };
}

export interface FixtureSchool {
  documentId: string;
  name: string;
}

export interface InvitationContact {
  first_name: string;
  last_name: string;
  contact_email: string;
}

/**
 * A school at the spec's exact precondition — Prospect / Not started — created
 * through the REAL ops contract. `POST /api/schools` creates schools `active` by
 * design (D-11 concierge default), so the PATCH to `prospect` is the honest way
 * to reach the precondition through the API rather than by poking the database.
 */
export async function createProspectSchool(label: string, nameOverride?: string): Promise<FixtureSchool> {
  const name = nameOverride ?? `E2E Onboarding ${label}`;
  const created = await opsFetch<{ data: { documentId: string } }>('/api/schools', {
    method: 'POST',
    body: JSON.stringify({
      name,
      suburb: 'Belmore',
      state: 'NSW',
      postcode: '2192',
      sector: 'government',
      contact_email: `seed-${label}@example.au`,
    }),
  });
  if (created.status !== 201) {
    throw new Error(`[e2e] fixture school create failed: ${created.status}`);
  }
  const { documentId } = created.body.data;

  const patched = await opsFetch(`/api/schools/${documentId}`, {
    method: 'PATCH',
    body: JSON.stringify({ account_status: 'prospect' }),
  });
  if (patched.status !== 200) {
    throw new Error(`[e2e] fixture school patch failed: ${patched.status}`);
  }
  return { documentId, name };
}

export interface OnboardingLink {
  token: string;
  url: string;
  expires_at: null;
  contact: { first_name: string; last_name: string; email: string };
}

/** C-SCH-04 (v2) straight through the API — the non-UI setup path. */
export function inviteViaApi(documentId: string, contact: InvitationContact) {
  return opsFetch<{ data: OnboardingLink }>(`/api/schools/${documentId}/onboarding-link`, {
    method: 'POST',
    body: JSON.stringify(contact),
  });
}

/** C-SCH-05 straight through the API. */
export function resendViaApi(documentId: string) {
  return opsFetch<{ data: OnboardingLink }>(
    `/api/schools/${documentId}/onboarding-link/resend`,
    { method: 'POST', body: JSON.stringify({}) },
  );
}

/** C-SCH-06 straight through the API. */
export function revokeViaApi(documentId: string) {
  return opsFetch<{ data: { revoked_links: number } }>(
    `/api/schools/${documentId}/onboarding-link/revoke`,
    { method: 'POST', body: JSON.stringify({}) },
  );
}

/**
 * Removes the fixture school. A failed delete is LOGGED, never swallowed — a
 * fixture that cannot be cleaned up is information, not something to hide.
 */
export async function cleanupSchool(documentId: string): Promise<void> {
  await revokeViaApi(documentId);
  const res = await opsFetch(`/api/ops/schools/${documentId}`, { method: 'DELETE' });
  if (res.status !== 200) {
    console.warn(`[e2e] fixture school ${documentId} not deleted: ${res.status}`);
  }
}

/** The ops school detail page for a fixture. */
export const detailPath = (documentId: string) => `/dashboard/ops/schools/${documentId}`;
