import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { expect, type APIRequestContext, type Page, type Response } from '@playwright/test';

import { roleCredentials, type AppRole } from './credentials';
import { cat, loadMessages } from './i18n';
import { apiEnv } from './auth-db';

// F8 LIVE sweep of the teacher surfaces — shared capture/observe kit.
// Every artefact this fleet writes is stamped F8-<epoch> and every screenshot
// lands in tests/e2e/captures/fleet8/NN-slug.png. Nothing here intercepts the
// network: each page is exercised exactly as a teacher would drive it.

export const CAPTURES = path.resolve(process.cwd(), 'tests', 'e2e', 'captures', 'fleet8');
export const STAMP = `F8-${Math.floor(Date.now() / 1000)}`;
export const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:5500';

mkdirSync(CAPTURES, { recursive: true });

/** NN-slug.png into captures/fleet8 — the fleet's screenshot proof convention. */
export async function shot(page: Page, name: string): Promise<string> {
  const file = path.join(CAPTURES, `${name}.png`);
  await page.screenshot({ path: file, animations: 'disabled' });
  return file;
}

export interface Traffic {
  consoleErrors: string[];
  pageErrors: string[];
  /** Every >=400 API response observed, as `STATUS METHOD PATH`. */
  badResponses: string[];
}

/** Observes console/page errors and failed API responses from first install. */
export function observe(page: Page): Traffic {
  const traffic: Traffic = { consoleErrors: [], pageErrors: [], badResponses: [] };
  page.on('pageerror', (error) => traffic.pageErrors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') traffic.consoleErrors.push(`console.error: ${message.text()}`);
  });
  page.on('response', (response: Response) => {
    if (response.status() < 400) return;
    // Static/asset 404s and dev-file probes are noise; API and page failures are signal.
    const url = new URL(response.url());
    if (url.pathname.startsWith('/_next')) return;
    traffic.badResponses.push(`${response.status()} ${response.request().method()} ${url.pathname}`);
  });
  return traffic;
}

export function drain(traffic: Traffic): string[] {
  return [...traffic.consoleErrors.splice(0), ...traffic.pageErrors.splice(0), ...traffic.badResponses.splice(0)];
}

const en = loadMessages('en');
const MIN_LOGIN_INTERVAL_MS = 3100;
let lastLoginSubmittedAt = 0;

/** Real /sign-in form for any seeded teacher email (t1/t2/t5 share the seed password). */
export async function signInTeacherEmail(page: Page, email: string): Promise<void> {
  const sinceLast = Date.now() - lastLoginSubmittedAt;
  if (lastLoginSubmittedAt !== 0 && sinceLast < MIN_LOGIN_INTERVAL_MS) {
    await page.waitForTimeout(MIN_LOGIN_INTERVAL_MS - sinceLast);
  }
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.portal.emailLabel'), { exact: true }).fill(email);
  await page.getByLabel(cat(en, 'Auth.portal.passwordLabel'), { exact: true }).fill(apiEnv('SEED_TEACHER_PASSWORD'));
  await page.getByRole('button', { name: cat(en, 'Auth.portal.loginButton'), exact: true }).click();
  lastLoginSubmittedAt = Date.now();
  // Under fleet load the shared-IP auth limiter (20 POST /api/auth/local per
  // minute) can 429 the submit; the form then bounces to the public landing
  // instead of /dashboard. ONE paced retry — never a loop.
  const reached = await page
    .waitForURL(/\/dashboard(\/|$)/, { timeout: 30_000 })
    .then(
      () => true,
      async () => {
        const path = new URL(page.url()).pathname.replace(/\/(en|zh|ko|ms|th|vi)$/, '');
        // Still on the form, or bounced to the public landing => the limiter ate it.
        if (path !== '/sign-in' && path !== '/' && !path.endsWith('/sign-in')) return false;
        await page.waitForTimeout(20_000);
        await page.goto('/sign-in');
        await page.getByLabel(cat(en, 'Auth.portal.emailLabel'), { exact: true }).fill(email);
        await page.getByLabel(cat(en, 'Auth.portal.passwordLabel'), { exact: true }).fill(apiEnv('SEED_TEACHER_PASSWORD'));
        await page.getByRole('button', { name: cat(en, 'Auth.portal.loginButton'), exact: true }).click();
        lastLoginSubmittedAt = Date.now();
        await page.waitForURL(/\/dashboard(\/|$)/, { timeout: 45_000 });
        return true;
      },
    );
  if (!reached) throw new Error(`[fleet8] sign-in as ${email} landed on ${page.url()}`);
}

/** Real /sign-in form for a named role (used for the parent guard probes). */
export async function signInRole(page: Page, role: AppRole): Promise<void> {
  const { email, password } = roleCredentials(role);
  const sinceLast = Date.now() - lastLoginSubmittedAt;
  if (lastLoginSubmittedAt !== 0 && sinceLast < MIN_LOGIN_INTERVAL_MS) {
    await page.waitForTimeout(MIN_LOGIN_INTERVAL_MS - sinceLast);
  }
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.portal.emailLabel'), { exact: true }).fill(email);
  await page.getByLabel(cat(en, 'Auth.portal.passwordLabel'), { exact: true }).fill(password);
  await page.getByRole('button', { name: cat(en, 'Auth.portal.loginButton'), exact: true }).click();
  lastLoginSubmittedAt = Date.now();
  await page.waitForURL(/\/dashboard(\/|$)/, { timeout: 30_000 });
}

/** Fresh JWT for direct API reads that mirror what a page just showed. */
export async function bearerFor(request: APIRequestContext, email: string): Promise<string> {
  const response = await request.post(`${API_BASE}/api/auth/local`, {
    data: { identifier: email, password: apiEnv('SEED_TEACHER_PASSWORD') },
  });
  expect(response.status()).toBe(200);
  return ((await response.json()) as { jwt: string }).jwt;
}

export interface ClassRow {
  class_document_id: string;
  name: string;
  student_count: number;
  status: string;
  year_level: number | null;
}

/** The signed-in teacher's own class list, exactly as C-TD-1 serves it. */
export async function readTeacherClasses(
  request: APIRequestContext,
  jwt: string,
): Promise<readonly ClassRow[]> {
  const response = await request.get(`${API_BASE}/api/teacher/dashboard`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(response.status()).toBe(200);
  const body = (await response.json()) as { classes: readonly ClassRow[] };
  return body.classes;
}

/** Waits for the teacher results list to be READY and returns it. */
export async function openResultsReady(page: Page): Promise<void> {
  await page.goto('/dashboard/results');
  await expect(page.locator('[data-surface="teacher-results"]')).toHaveAttribute('data-status', /^(ready|empty)$/, {
    timeout: 45_000,
  });
}
