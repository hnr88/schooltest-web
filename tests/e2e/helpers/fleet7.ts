/**
 * Fleet-7 shared helpers — LIVE invitation-flow testing across every invite
 * kind (school-admin staff invite, ops staff invite, student magic link,
 * teacher trial magic link). Real browser + real API + Mailpit.
 *
 * Deliberately NO runSql: this stack's live API database is the host postgres
 * on 127.0.0.1:5540, while the shared auth-db helper's docker fallback lands on
 * the stale `schooltest-api-st1-postgres` container copy — a read there is a
 * read of the WRONG database (it silently returns '' for rows the API just
 * wrote). Tokens are therefore taken from the API's own create response
 * (`invite_url`), never from a database probe.
 */
import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { expect, type APIRequestContext, type Page } from '@playwright/test';

import { cat, icu, loadMessages } from './i18n';
import { getMessage, MAILPIT_API, searchMessages, waitForMessages, type MailpitMessage } from './mailpit';
import { loginAs, type AppRole } from './roles';

export const en = loadMessages('en');
export { cat, icu };

export const API = 'http://127.0.0.1:5500';
export const MAILPIT_UI = 'http://127.0.0.1:8125';

const CAPTURES = path.resolve(__dirname, '..', 'captures', 'fleet7');

/** Screenshot into tests/e2e/captures/fleet7/<name>.png (dir created lazily). */
export async function shot(page: Page, name: string): Promise<string> {
  mkdirSync(CAPTURES, { recursive: true });
  const file = path.join(CAPTURES, `${name}.png`);
  await page.screenshot({ path: file });
  return file;
}

/** F7-<epoch>@schooltest.local — every address this mission mints is stamped. */
export function freshEmail(flow: string): string {
  return `f7-${flow}-${Date.now()}@schooltest.local`;
}

export interface RoleJwt {
  jwt: string;
  email: string;
}

/**
 * The shared dev API has been flapping (operator-side restarts during this
 * mission, inotify-limit churn). Outage failures are ENVIRONMENTAL, never app
 * verdicts, so every contract call below waits the API back up and retries
 * once instead of recording a false negative.
 */
export async function waitApiUp(request: APIRequestContext): Promise<void> {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const res = await request.get(`${API}/`, { failOnStatusCode: false });
      if (res.status() !== -1) return;
    } catch {
      // connection refused — wait and retry
    }
    await new Promise((resolve) => setTimeout(resolve, 10_000));
  }
}

async function resilient<T>(
  request: APIRequestContext,
  fn: () => Promise<T>,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const message = String((error as Error).message ?? '');
    if (!/ECONNREFUSED|other side closed|socket hang up|fetch failed/i.test(message)) throw error;
    await waitApiUp(request);
    return fn();
  }
}

/** GET against the API that tolerates a restart window. */
export async function apiGetSafe(
  request: APIRequestContext,
  path: string,
  headers?: Record<string, string>,
): Promise<import('@playwright/test').APIResponse> {
  return resilient(request, () =>
    request.get(`${API}${path}`, { headers, failOnStatusCode: false }));
}

/** POST against the API that tolerates a restart window. */
export async function apiPostSafe(
  request: APIRequestContext,
  path: string,
  data: unknown,
  headers?: Record<string, string>,
): Promise<import('@playwright/test').APIResponse> {
  return resilient(request, () =>
    request.post(`${API}${path}`, { data, headers, failOnStatusCode: false }));
}

/** School-admin bearer through the REAL /api/auth/local contract. */
export async function schoolAdminJwt(request: APIRequestContext): Promise<string> {
  const res = await apiPostSafe(request, '/api/auth/local', {
    identifier: 'schooladmin-a@schooltest.local',
    password: 'Schooladmin1234!',
  });
  expect(res.status(), 'school-admin login').toBe(200);
  return ((await res.json()) as { jwt: string }).jwt;
}

/** Ops portal bearer (seeded ops admin). */
export async function opsJwt(request: APIRequestContext): Promise<string> {
  const res = await apiPostSafe(request, '/api/auth/local', {
    identifier: 'admin@schooltest.local',
    password: 'Admin1234!',
  });
  expect(res.status(), 'ops login').toBe(200);
  return ((await res.json()) as { jwt: string }).jwt;
}

export interface MintedInvite {
  email: string;
  documentId: string;
  /** 64-hex token from the API's own invite_url — no DB probe anywhere. */
  token: string;
  /** Locale-prefixed accept path, e.g. /en/invite/<token>. */
  invitePath: string;
}

/**
 * Mint a staff invitation through the school-admin contract
 * (POST /api/schools/me/invitations, C-INV-01). The response's invite_url is
 * the product's own link, pointing at the live web origin.
 */
export async function mintSchoolInvite(
  request: APIRequestContext,
  email: string,
  role: 'teacher' | 'school_admin' = 'teacher',
): Promise<MintedInvite> {
  const jwt = await schoolAdminJwt(request);
  const res = await request.post(`${API}/api/schools/me/invitations`, {
    headers: { Authorization: `Bearer ${jwt}` },
    data: { email, first_name: 'Fleet', last_name: 'Seven', role },
  });
  expect(res.status(), `invitation create for ${email}: ${await res.text()}`).toBe(201);
  const data = ((await res.json()) as { data: { documentId: string; invite_url: string } }).data;
  const token = data.invite_url.split('/invite/')[1];
  expect(token, 'invite_url carries a 64-hex token').toMatch(/^[0-9a-f]{64}$/);
  return { email, documentId: data.documentId, token, invitePath: `/en/invite/${token}` };
}

/** The newest email for `email`, with its /en/invite/<token> link extracted. */
export async function inviteEmailFor(
  request: APIRequestContext,
  email: string,
  count = 1,
): Promise<{ message: MailpitMessage; invitePath: string }> {
  await waitForMessages(request, email, count);
  const summaries = await searchMessages(request, `to:${email}`);
  const message = await getMessage(request, summaries[0].ID);
  const link = message.Text.match(/https?:\/\/\S*\/en\/invite\/([0-9a-f]{64})/)?.[0];
  expect(link, 'invite email carries a /en/invite/<token> link').toBeTruthy();
  return { message, invitePath: link!.replace(/^https?:\/\/[^/]+/, '') };
}

/** How many Mailpit messages a mailbox currently holds (idempotency probes). */
export async function mailpitCount(request: APIRequestContext, email: string): Promise<number> {
  const summaries = await searchMessages(request, `to:${email}`, 200);
  return summaries.length;
}

/**
 * Screenshot the actual email as the recipient sees it: fetch the newest
 * message for `email` over the Mailpit REST API and render its stored HTML in
 * the browser (Mailpit's own iframe does the same). The SPA's deep link is
 * deliberately NOT used — a direct `#/message/<id>` load renders an arbitrary
 * inbox message, not the addressed one.
 */
export async function screenshotMailpitMessage(
  page: Page,
  request: APIRequestContext,
  email: string,
  name: string,
): Promise<MailpitMessage> {
  const summaries = await searchMessages(request, `to:${email}`, 1);
  const message = await getMessage(request, summaries[0].ID);
  await page.setContent(message.HTML || `<pre>${message.Text}</pre>`);
  await page.waitForTimeout(500);
  await shot(page, name);
  return message;
}

/**
 * Accept an invitation through the REAL /invite/<token> UI, as the invitee
 * would. Returns once the browser is signed in on a dashboard.
 */
export async function acceptInviteViaUi(
  page: Page,
  invitePath: string,
  password: string,
  firstShotName?: string,
): Promise<void> {
  await page.goto(invitePath);
  await expect(
    page.getByRole('heading', { name: new RegExp(cat(en, 'Invite.welcomeTitle').replace('{school}', '.*')) }),
  ).toBeVisible({ timeout: 60_000 });
  await page.locator('#invite-first-name').fill('Fleet');
  await page.locator('#invite-last-name').fill('Seven');
  await page.locator('#invite-password').fill(password);
  await page.locator('#invite-confirm-password').fill(password);
  if (firstShotName) await shot(page, firstShotName);
  await page.getByRole('button', { name: cat(en, 'Invite.form.submit'), exact: true }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 60_000 });
}

/** Clear the browser session (localStorage) the way the other specs do. */
export async function signOut(page: Page): Promise<void> {
  // Absolute on purpose: after screenshotMailpitMessage() the document is a
  // setContent render, and a relative goto from there can abort.
  const web = process.env.E2E_BASE_URL ?? 'http://localhost:3002';
  await page.goto(`${web}/`);
  await page.evaluate(() => window.localStorage.clear());
}

/** Real-form sign-in with a role from the shared credentials module. */
export async function loginAsPage(page: Page, role: AppRole): Promise<void> {
  // The shared API restarts intermittently during this mission; a sign-in
  // that strands on /sign-in because the API bounced is retried twice (paced)
  // before it counts as a real failure.
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    await loginAs(page, role).catch(async (error) => {
      if (attempt === 3) throw error;
      await page.waitForTimeout(20_000);
    });
    if (page.url().includes('/dashboard')) return;
    if (attempt < 3) await page.waitForTimeout(10_000);
  }
}
