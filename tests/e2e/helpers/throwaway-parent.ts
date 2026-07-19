/**
 * Throwaway-parent fixture helper (task 020) — every account is created
 * through the api's REAL register contract (C-AUTH-REGISTER, never a UI
 * signup loop), confirmed via the REAL Mailpit link (C-AUTH-CONFIRM), and
 * returned ready for UI logins. Emails are always fresh
 * `e2e-<flow>-<ts>@schooltest.test` so the 2/hour/email budgets never collide
 * across flows, workers, or runs; callers delete their auth_email_requests
 * rows in afterAll (deleteAuthEmailRows). Registration-dependent tests stay
 * serial per spec file (D20 register race).
 */
import { expect, type APIRequestContext } from '@playwright/test';

import { userRoleType } from './auth-db';
import { API_BASE_URL, fetchConfirmationLink } from './mailpit';

/** Default password for throwaway parents (schema minLength 6, ≤72 bytes). */
export const E2E_PASSWORD = 'E2eParent1234!';

/** Fresh throwaway identity for one flow — unique per call. */
export function freshEmail(flow: string): string {
  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  return `e2e-${flow}-${suffix}@schooltest.test`;
}

export interface ThrowawayParent {
  email: string;
  username: string;
  password: string;
}

/** POST /api/auth/local/register — 200 `{ user }`, NO jwt, confirmed=false (D-AUTH-1). */
export async function registerParent(
  request: APIRequestContext,
  flow: string,
  password = E2E_PASSWORD,
): Promise<ThrowawayParent> {
  const email = freshEmail(flow);
  // Suffix FIRST: usernames cap at 20 chars, so a long flow name must never
  // truncate away the per-call uniqueness (task 066: `students-empty` kept only
  // 4 suffix chars → "Username are already taken" collisions across runs). The
  // suffix is the last dash-separated alnum token of the freshEmail local part.
  const suffix = email.match(/-([a-z0-9]+)@/)?.[1] ?? '';
  const username = `e2e${suffix}${flow.replace(/[^a-z0-9]/g, '')}`.slice(0, 20);
  const res = await request.post(`${API_BASE_URL}/api/auth/local/register`, {
    data: { username, email, password },
  });
  if (res.status() !== 200) {
    throw new Error(`[e2e] register ${email} failed: ${res.status()} ${await res.text()}`);
  }
  const body = (await res.json()) as { jwt?: string; user?: { confirmed?: boolean } };
  if ('jwt' in body || body.user?.confirmed !== false) {
    throw new Error(`[e2e] register ${email}: expected {user} with confirmed=false and NO jwt`);
  }
  return { email, username, password };
}

/**
 * Full real round-trip: register → styled Mailpit confirmation link → GET
 * redeem (302, redirects OFF) → poll the DB until the D20 parent-role grant
 * has landed (UI logins hit parent-guarded routes immediately after).
 */
export async function registerAndConfirmParent(
  request: APIRequestContext,
  flow: string,
  password = E2E_PASSWORD,
): Promise<ThrowawayParent> {
  const account = await registerParent(request, flow, password);
  const link = await fetchConfirmationLink(request, account.email);
  const res = await request.get(link, { maxRedirects: 0 });
  if (res.status() !== 302) {
    throw new Error(`[e2e] confirm ${account.email} failed: ${res.status()} ${await res.text()}`);
  }
  await expect
    .poll(() => userRoleType(account.email), { message: `parent role assigned to ${account.email}` })
    .toBe('parent');
  return account;
}

/**
 * Real POST /api/auth/local login for a confirmed throwaway parent → the 7d
 * jwt (C-AUTH-LOGIN). With D-AUTH-1 confirmation ON, register returns NO jwt —
 * this is the only api-side way for a spec to seed `app.auth.token`.
 */
export async function loginParentJwt(
  request: APIRequestContext,
  account: ThrowawayParent,
): Promise<string> {
  const res = await request.post(`${API_BASE_URL}/api/auth/local`, {
    data: { identifier: account.email, password: account.password },
  });
  if (res.status() !== 200) {
    throw new Error(`[e2e] login ${account.email} failed: ${res.status()} ${await res.text()}`);
  }
  const body = (await res.json()) as { jwt?: string };
  if (!body.jwt) throw new Error(`[e2e] login ${account.email}: no jwt in response`);
  return body.jwt;
}
