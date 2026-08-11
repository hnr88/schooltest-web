import { readFileSync } from 'node:fs';
import path from 'node:path';

import {
  expect,
  type APIRequestContext,
  type Browser,
  type Locator,
  type Page,
  type PlaywrightWorkerArgs,
} from '@playwright/test';

import { classStudentsResponseSchema } from '@/modules/teacher/schemas/teacher-result.schema';
import { teacherDashboardResponseSchema } from '@/modules/teacher/schemas/teacher.schema';
import type { ClassStudentsResponse } from '@/modules/teacher/types/teacher-result.types';
import type { DashboardClass } from '@/modules/teacher/types/teacher.types';

import { cat } from './i18n';
import { apiEnv, runSql } from './auth-db';
import { en, navLink, signIn } from './teacher-rail';

// Task 040 harness. Everything the Results shell spec compares the DOM against is
// read LIVE from the same Strapi the browser talks to, parsed through the shipped
// contract mirror. There is no expected-value literal in the spec: the numbers
// come from the server, so a contract drift fails the spec instead of passing it.

/**
 * The origin the browser's Axios instance uses, read from schooltest-web/.env and
 * loopback-pinned to IPv4 for this NODE-side client only — Strapi binds
 * `IPv4 *:5500` while Node's `localhost` resolves `::1` first (the measured
 * reason teacher-contract-live.spec.ts pins it too).
 */
const API_BASE = (() => {
  const envPath = path.resolve(process.cwd(), '.env');
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^NEXT_PUBLIC_API_BASE_URL=(.*)$/);
    if (!match) continue;
    const url = new URL(match[1].replace(/^(['"])(.*)\1$/, '$2'));
    if (url.hostname === 'localhost') url.hostname = '127.0.0.1';
    return url.origin;
  }
  throw new Error('[e2e] NEXT_PUBLIC_API_BASE_URL missing from schooltest-web/.env');
})();

/** The seeded teacher, resolved by ROLE from Postgres — no hardcoded credential. */
export const TEACHER_EMAIL = runSql(
  `select u.email from up_users u
     join up_users_role_lnk l on l.user_id = u.id
     join up_roles r on r.id = l.role_id
    where r.type = 'teacher' order by u.id limit 1`,
);

export interface LiveResults {
  classes: readonly DashboardClass[];
  detail: ClassStudentsResponse;
}

async function bearer(request: APIRequestContext): Promise<string> {
  const response = await request.post(`${API_BASE}/api/auth/local`, {
    data: { identifier: TEACHER_EMAIL, password: apiEnv('SEED_TEACHER_PASSWORD') },
  });
  if (!response.ok()) {
    throw new Error(`[e2e] teacher sign-in failed: ${response.status()} ${await response.text()}`);
  }
  const body: unknown = await response.json();
  const jwt = (body as { jwt?: string }).jwt;
  if (!jwt) throw new Error('[e2e] POST /api/auth/local returned no jwt');
  return jwt;
}

async function readJson(
  request: APIRequestContext,
  jwt: string,
  path: string,
): Promise<{ status: number; body: unknown }> {
  const response = await request.get(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  return { status: response.status(), body: (await response.json()) as unknown };
}

/**
 * C-TD-1 (the class list) plus C-TR-1 for the FIRST class (the class detail
 * header). Both bodies are parsed with the module's own Zod mirrors, so a
 * response that diverges from CONTRACTS.md throws here rather than being
 * silently compared against a loosened shape.
 */
export async function readLiveResults(
  playwright: PlaywrightWorkerArgs['playwright'],
): Promise<LiveResults> {
  const request = await playwright.request.newContext();
  try {
    const jwt = await bearer(request);

    const dash = await readJson(request, jwt, '/api/teacher/dashboard');
    if (dash.status !== 200) throw new Error(`[e2e] C-TD-1 answered ${dash.status}`);
    const classes = teacherDashboardResponseSchema.parse(dash.body).classes;
    if (classes.length === 0) throw new Error('[e2e] the seeded teacher owns no class');

    const first = classes[0].class_document_id;
    const detail = await readJson(request, jwt, `/api/teacher/classes/${first}/students`);
    if (detail.status !== 200) throw new Error(`[e2e] C-TR-1 answered ${detail.status}`);

    return { classes, detail: classStudentsResponseSchema.parse(detail.body) };
  } finally {
    await request.dispose();
  }
}

/** One class row of the Results list, and one cell of the class-detail header. */
export const resultsRows = (page: Page): Locator => page.locator('[data-slot="results-class-row"]');
export const headerStat = (page: Page, key: string): Locator =>
  page.locator(`[data-stat="${key}"]`);

/**
 * One signed-in teacher page for a whole spec file.
 *
 * Measured on this instance: driving the real /sign-in form once per test made
 * every SECOND sign-in hang on the post-login redirect — the API's auth guard
 * rate-limits `POST /api/auth/local` per IP, and nine logins in one file trip it.
 * Signing in ONCE per file and navigating in-session is both the honest fix and
 * the faster one; it is why these specs run `mode: 'serial'` over a shared page.
 */
export async function signedInTeacherPage(browser: Browser): Promise<Page> {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await signIn(page, 'teacher');
  return page;
}

/** Opens Results from the rail and waits for the READY class list. */
export async function openResultsList(page: Page): Promise<void> {
  await navLink(page, cat(en, 'Shell.nav.results')).click();
  await page.waitForURL('**/dashboard/results');
  await expect(page.locator('[data-surface="teacher-results"]')).toHaveAttribute(
    'data-status',
    'ready',
    { timeout: 20_000 },
  );
}

/**
 * …then clicks through to the first class and waits for the class detail to reach
 * `data-status="ready"`. Waiting on READY (not on any element) means a spec can
 * never assert against a loading frame or an error branch by accident.
 */
export async function openFirstClass(page: Page, live: LiveResults): Promise<void> {
  if (!page.url().includes('/dashboard/results')) await openResultsList(page);
  await resultsRows(page).first().click();
  await page.waitForURL(`**/dashboard/results/${live.classes[0].class_document_id}`);
  await expect(page.locator('[data-surface="teacher-class-results"]')).toHaveAttribute(
    'data-status',
    'ready',
    { timeout: 20_000 },
  );
}

/** Back to the class list from the detail, in-session (no second sign-in). */
export async function backToResultsList(page: Page): Promise<void> {
  await page.goto('/dashboard/results');
  await expect(page.locator('[data-surface="teacher-results"]')).toHaveAttribute(
    'data-status',
    'ready',
    { timeout: 20_000 },
  );
}
