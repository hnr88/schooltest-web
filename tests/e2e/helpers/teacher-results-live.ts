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

import { classProgressResponseSchema } from '@/modules/teacher/schemas/teacher-progress.schema';
import { classStudentsResponseSchema } from '@/modules/teacher/schemas/teacher-result.schema';
import { teacherDashboardResponseSchema } from '@/modules/teacher/schemas/teacher.schema';
import type { ClassProgressResponse } from '@/modules/teacher/types/teacher-progress.types';
import type { ClassStudentsResponse } from '@/modules/teacher/types/teacher-result.types';
import type { DashboardClass } from '@/modules/teacher/types/teacher.types';

import { roleCredentials } from './credentials';
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
export const API_BASE = (() => {
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

/** The deterministic journey teacher with mixed Test A/Test B evidence. */
export const TEACHER_EMAIL = roleCredentials('teacher').email;

export interface LiveResults {
  classes: readonly DashboardClass[];
  detail: ClassStudentsResponse;
}

export async function bearer(
  request: APIRequestContext,
  teacherEmail: string = TEACHER_EMAIL,
): Promise<string> {
  const response = await request.post(`${API_BASE}/api/auth/local`, {
    data: { identifier: teacherEmail, password: apiEnv('SEED_TEACHER_PASSWORD') },
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
  teacherEmail: string = TEACHER_EMAIL,
): Promise<LiveResults> {
  const request = await playwright.request.newContext();
  try {
    const jwt = await bearer(request, teacherEmail);

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

/**
 * C-TR-1 for ONE named class, parsed through the same shipped mirror. Task 041
 * uses it to compare the Students table of a SECOND class against the server —
 * the seeded classes carry different per-cell states, and a spec that only ever
 * read `classes[0]` could not see that.
 */
export async function readClassStudentsLive(
  playwright: PlaywrightWorkerArgs['playwright'],
  classDocumentId: string,
  teacherEmail: string = TEACHER_EMAIL,
): Promise<ClassStudentsResponse> {
  const request = await playwright.request.newContext();
  try {
    const jwt = await bearer(request, teacherEmail);
    const detail = await readJson(request, jwt, `/api/teacher/classes/${classDocumentId}/students`);
    if (detail.status !== 200) throw new Error(`[e2e] C-TR-1 answered ${detail.status}`);
    return classStudentsResponseSchema.parse(detail.body);
  } finally {
    await request.dispose();
  }
}

/**
 * C-TR-4 for ONE class, parsed through the shipped mirror. Task 045's spec
 * compares the Progress tab against this body, so every number the DOM shows has
 * to be the server's own — and a body that drifts from CONTRACTS.md throws here.
 */
export async function readClassProgressLive(
  playwright: PlaywrightWorkerArgs['playwright'],
  classDocumentId: string,
  teacherEmail: string = TEACHER_EMAIL,
): Promise<ClassProgressResponse> {
  const request = await playwright.request.newContext();
  try {
    const jwt = await bearer(request, teacherEmail);
    const progress = await readJson(
      request,
      jwt,
      `/api/teacher/classes/${classDocumentId}/progress`,
    );
    if (progress.status !== 200) throw new Error(`[e2e] C-TR-4 answered ${progress.status}`);
    return classProgressResponseSchema.parse(progress.body);
  } finally {
    await request.dispose();
  }
}

/** Opens ONE named class detail in-session and waits for the READY frame. */
export async function openClassResults(page: Page, classDocumentId: string): Promise<void> {
  await page.goto(`/dashboard/results/${classDocumentId}`);
  await expect(page.locator('[data-surface="teacher-class-results"]')).toHaveAttribute(
    'data-status',
    'ready',
    { timeout: 20_000 },
  );
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
