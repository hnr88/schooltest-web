/**
 * Revocation e2e helpers (mission task 223). Staff are provisioned through the
 * REAL invitation contract (C-INV-01 → C-INV-06) against the running API —
 * never a signup form, never a direct row insert.
 */
import { runSql } from './auth-db';

export { runSql };

const API_BASE_URL =
  process.env.E2E_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:5500';

const SCHOOL_ADMIN = {
  email: process.env.E2E_SCHOOL_ADMIN_EMAIL ?? 'schooladmin-a@schooltest.local',
  password: process.env.E2E_SCHOOL_ADMIN_PASSWORD ?? 'SchoolAdmin1234!',
};

export interface HttpResult {
  status: number;
  body: unknown;
}

async function request(
  path: string,
  init: RequestInit & { jwt?: string } = {},
): Promise<HttpResult> {
  const { jwt, headers, ...rest } = init;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
      ...(headers as Record<string, string> | undefined),
    },
  });
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

export function apiGet(path: string, jwt?: string): Promise<HttpResult> {
  return request(path, { jwt });
}

export function apiLogin(identifier: string, password: string): Promise<HttpResult> {
  return request('/api/auth/local', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  });
}


/**
 * The JWT is minted ONCE per worker. The API's brute-force guard allows 20
 * logins per minute per IP, and a helper that logs in on every call blows
 * through that in one spec — which surfaced as a bogus 429 mid-suite, not as a
 * product defect.
 */
let cachedJwt: string | null = null;

async function schoolAdminJwt(): Promise<string> {
  if (cachedJwt) return cachedJwt;
  const res = await apiLogin(SCHOOL_ADMIN.email, SCHOOL_ADMIN.password);
  if (res.status !== 200) throw new Error(`[e2e] school_admin login failed: ${res.status}`);
  cachedJwt = (res.body as { jwt: string }).jwt;
  return cachedJwt;
}

export interface Invitation {
  email: string;
  password: string;
  invitationId: string;
  token: string;
}

/** Invite a throwaway teacher into the seeded demo school through C-INV-01. */
export async function createInvitation(label: string): Promise<Invitation> {
  const email = `e2e-${label}-${Date.now()}@schooltest.local`;
  const res = await request('/api/schools/me/invitations', {
    method: 'POST',
    jwt: await schoolAdminJwt(),
    body: JSON.stringify({ email, first_name: 'E2E', last_name: label, role: 'teacher' }),
  });
  if (res.status !== 200 && res.status !== 201) {
    throw new Error(`[e2e] invitation create failed: ${res.status}`);
  }
  const invitationId = (res.body as { data: { documentId: string } }).data.documentId;
  return {
    email,
    password: 'E2eRevoke1!A',
    invitationId,
    token: runSql(`select token from invitations where document_id='${invitationId}'`),
  };
}

export interface AcceptedTeacher extends Invitation {
  documentId: string;
  jwt: string;
}

/** Redeem the invitation through C-INV-06, creating the real account. */
export async function acceptInvitation(invite: Invitation): Promise<AcceptedTeacher> {
  const res = await request(`/api/invitations/${invite.token}/accept`, {
    method: 'POST',
    body: JSON.stringify({ password: invite.password }),
  });
  if (res.status !== 200) throw new Error(`[e2e] invitation accept failed: ${res.status}`);
  const data = (res.body as { data: { jwt: string; user: { documentId: string } } }).data;
  return { ...invite, documentId: data.user.documentId, jwt: data.jwt };
}

/** C-INV-04/07 revoke, as the school admin. */
export async function revokeInvitation(invitationId: string): Promise<HttpResult> {
  return request(`/api/schools/me/invitations/${invitationId}`, {
    method: 'DELETE',
    jwt: await schoolAdminJwt(),
  });
}

/** C-TCH-03 remove, as the school admin. */
export async function removeTeacher(userDocumentId: string): Promise<HttpResult> {
  return request(`/api/schools/me/teachers/${userDocumentId}`, {
    method: 'DELETE',
    jwt: await schoolAdminJwt(),
  });
}

/**
 * Flip `blocked` directly — the one state no contracted endpoint can set for an
 * arbitrary account in isolation, and the spec needs it isolated to prove the
 * platform's own revocation behaviour.
 */
export function setBlocked(email: string, blocked: boolean): void {
  runSql(`update up_users set blocked=${blocked ? 'true' : 'false'} where email='${email}'`);
}
