/**
 * BUG-005 / BUG-006 journey fixtures — all through the REAL API, nothing
 * inserted behind its back:
 *
 *  - a FRESH school (ops C-SCH create) whose only staff member is a school
 *    admin appointed through the ops admin-invitation route and activated
 *    through the public accept route — i.e. a school admin with NO teachers;
 *  - teacher invitations minted by that admin (C-INV-01, legacy body, whose
 *    201 carries the emailed invite_url — the token is its last segment, so no
 *    Mailpit or DB read is needed) and accepted through C-INV-06.
 *
 * Cleanup removes the staff accounts and the school through the ops contract.
 */
import path from 'node:path';

import { expect, type Page } from '@playwright/test';

import { cat, loadMessages } from './i18n';
import { cleanupSchool, opsJwt } from './ops-onboarding';

export const API = process.env.E2E_API_BASE_URL ?? 'http://127.0.0.1:5500';
export const en = loadMessages('en');

export const PROOF_ROOT = process.env.BUG_PROOF_DIR ?? '/Users/hunor.nagy/Desktop/live_feedback_1/proof';
export const proofPath = (ticket: 'BUG-005' | 'BUG-006', file: string) => path.join(PROOF_ROOT, ticket, file);

export interface Person {
  email: string;
  first: string;
  last: string;
  password: string;
}

export interface FreshSchool {
  documentId: string;
  name: string;
  admin: Person;
  adminJwt: string;
}

async function json<T>(res: Response, label: string, expected: number): Promise<T> {
  const body = (await res.json().catch(() => ({}))) as T;
  if (res.status !== expected) {
    throw new Error(`[bug005-006] ${label} answered ${res.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

export function tokenFromInviteUrl(inviteUrl: string | undefined): string {
  const token = (inviteUrl ?? '').split('/invite/')[1] ?? '';
  if (!token) throw new Error('[bug005-006] invite_url carried no token');
  return token;
}

export async function acceptInvitation(token: string, person: Person): Promise<{ jwt: string; documentId: string }> {
  const body = await json<{ data: { jwt: string; user: { documentId: string } } }>(
    await fetch(`${API}/api/invitations/${token}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: person.password, first_name: person.first, last_name: person.last }),
    }),
    'invitation accept',
    200,
  );
  return { jwt: body.data.jwt, documentId: body.data.user.documentId };
}

/** A new school whose ONLY staff member is an activated school admin. */
export async function createSchoolWithAdminOnly(label: string): Promise<FreshSchool> {
  const stamp = `${Date.now()}`;
  const ops = await opsJwt();
  const name = `${label} ${stamp}`;
  const created = await json<{ data: { documentId: string } }>(
    await fetch(`${API}/api/schools`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ops}` },
      body: JSON.stringify({
        name,
        suburb: 'Belmore',
        state: 'NSW',
        postcode: '2192',
        sector: 'government',
        contact_email: `${label.toLowerCase().replace(/\W+/g, '-')}-${stamp}@schooltest.local`,
      }),
    }),
    'ops school create',
    201,
  );
  const documentId = created.data.documentId;
  const admin: Person = {
    email: `bug00x-admin-${stamp}@schooltest.local`,
    first: 'Hint',
    last: `Admin${stamp}`,
    password: `Bug00x!Admin${stamp}`,
  };
  const invite = await json<{ data: { invite_url?: string } }>(
    await fetch(`${API}/api/ops/schools/${documentId}/admin-invitations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ops}` },
      body: JSON.stringify({ email: admin.email, first_name: admin.first, last_name: admin.last }),
    }),
    'ops admin invitation',
    201,
  );
  const accepted = await acceptInvitation(tokenFromInviteUrl(invite.data.invite_url), admin);
  return { documentId, name, admin, adminJwt: accepted.jwt };
}

/** C-INV-01 as the school admin: a TEACHER invitation; returns its id + token. */
export async function inviteTeacher(
  adminJwt: string,
  person: Person,
): Promise<{ documentId: string; token: string }> {
  const body = await json<{ data: { documentId: string; invite_url?: string } }>(
    await fetch(`${API}/api/schools/me/invitations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminJwt}` },
      body: JSON.stringify({ email: person.email, first_name: person.first, last_name: person.last, role: 'teacher' }),
    }),
    'teacher invitation',
    201,
  );
  return { documentId: body.data.documentId, token: tokenFromInviteUrl(body.data.invite_url) };
}

export function teacherPerson(tag: string): Person {
  const stamp = `${Date.now()}`;
  return {
    email: `bug00x-${tag}-${stamp}@schooltest.local`,
    first: 'Pending',
    last: `Teacher${stamp}`,
    password: `Bug00x!Teacher${stamp}`,
  };
}

/**
 * CORS bridge for a worktree dev server on a port the API's FRONTEND_ORIGIN
 * allow-list does not name (e.g. E2E_PORT=3105 — 3000/3001/3010 are taken by
 * the live stacks). Opt-in with E2E_CORS_BRIDGE=1: the browser's API calls are
 * forwarded unchanged by Playwright and only the CORS response headers are
 * added, so what the app sends and what the API answers are untouched.
 */
const bridgedPages = new WeakSet<Page>();

export async function bridgeApiCors(page: Page): Promise<void> {
  if (process.env.E2E_CORS_BRIDGE !== '1' || bridgedPages.has(page)) return;
  bridgedPages.add(page);
  await page.route(`${API}/**`, async (route) => {
    const request = route.request();
    const origin = (await request.headerValue('origin')) ?? '*';
    const cors = {
      'access-control-allow-origin': origin,
      'access-control-allow-credentials': 'true',
    };
    if (request.method() === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: {
          ...cors,
          'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
          'access-control-allow-headers': (await request.headerValue('access-control-request-headers')) ?? '*',
        },
      });
      return;
    }
    const response = await route.fetch();
    await route.fulfill({ response, headers: { ...response.headers(), ...cors } });
  });
}

const MIN_LOGIN_INTERVAL_MS = 3100;
let lastLoginAt = 0;

/** Sign in through the REAL portal form with an arbitrary account. */
export async function signIn(page: Page, person: Person): Promise<void> {
  const since = Date.now() - lastLoginAt;
  if (lastLoginAt !== 0 && since < MIN_LOGIN_INTERVAL_MS) await page.waitForTimeout(MIN_LOGIN_INTERVAL_MS - since);
  await bridgeApiCors(page);
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.portal.emailLabel'), { exact: true }).fill(person.email);
  await page.getByLabel(cat(en, 'Auth.portal.passwordLabel'), { exact: true }).fill(person.password);
  await page.getByRole('button', { name: cat(en, 'Auth.portal.loginButton'), exact: true }).click();
  lastLoginAt = Date.now();
  await page.waitForURL(/\/dashboard(\/|$)/, { timeout: 30_000 });
  expect(page.url()).toContain('/dashboard');
}

export async function signOut(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.evaluate(() => window.localStorage.clear());
}

export async function removeSchool(school: FreshSchool | null, staffEmails: string[]): Promise<void> {
  if (!school) return;
  await cleanupSchool(school.documentId, [school.admin.email, ...staffEmails]);
}
