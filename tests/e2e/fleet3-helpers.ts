/**
 * F3 scratch helpers — LIVE-stack fixture resolution plus the shared UI
 * plumbing for the fleet3-*.spec.ts slices (ops students tab, import panel).
 *
 * WHY NOT helpers/fixture-ids.ts: that helper reaches Postgres through
 * `docker exec schooltest-api-st1-postgres`, which on THIS machine (2026-09-16)
 * holds a DIFFERENT database — 329 schools, "SchoolTest Demo School A" =
 * peiz8qtjwkyxvv0q2rnd0a42 — from the one the running API on :5500 actually
 * serves through host port 5540 (DATABASE_* in schooltest-api/.env): 408
 * schools, "SchoolTest Demo School A" = y71h16mmldmxfecnao4diqd0. Fixture ids
 * resolved from the container are dead to the live API (`school … not found`).
 * Until the shared helper is fixed, the fleet3 specs resolve natural keys from
 * the LIVE database directly. Same discipline (name, never pinned id), right
 * instance.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

import { expect, type APIRequestContext, type Page } from '@playwright/test';

import { roleCredentials } from './helpers/credentials';
import { cat, loadMessages } from './helpers/i18n';
import { loginCached } from './helpers/http';

export const en = loadMessages('en');
export const API = process.env.E2E_API_BASE_URL ?? 'http://127.0.0.1:5500';

/** Browser sign-in account (the seeded ops persona the task pins). */
export const OPS = roleCredentials('ops');
/** API account for fixture setup/reads (same ops role, second persona). */
export const OPS_API = roleCredentials('opsApi');

export const CAPTURES = path.resolve(__dirname, 'captures', 'fleet3');

/** Every row this slice creates carries the stamp, so a leak is greppable. */
export function f3Stamp(prefix = 'F3'): string {
  return `${prefix}-${Date.now()}`;
}

/* ------------------------------------------------------------------ *
 * Live database (host 5540) — the one the running API serves.
 * ------------------------------------------------------------------ */

const require = createRequire(__filename);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let poolPromise: Promise<any> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function livePool(): Promise<any> {
  if (poolPromise === null) {
    poolPromise = (async () => {
      const envPath = path.resolve(__dirname, '../../../schooltest-api/.env');
      const env: Record<string, string> = {};
      for (const line of readFileSync(envPath, 'utf8').split('\n')) {
        const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
        if (match) env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
      }
      const { Pool } = require(path.resolve(__dirname, '../../../schooltest-api/node_modules/pg'));
      return new Pool({
        host: env.DATABASE_HOST,
        port: Number(env.DATABASE_PORT),
        user: env.DATABASE_USERNAME,
        password: env.DATABASE_PASSWORD,
        database: env.DATABASE_NAME,
        max: 1,
      });
    })();
  }
  return poolPromise;
}

export async function liveSqlOne(sql: string, what: string): Promise<string> {
  const pool = await livePool();
  const result = await pool.query(sql);
  expect(result.rows, `live DB row for ${what}`).toHaveLength(1);
  return String(Object.values(result.rows[0])[0]);
}

/** The demo school the LIVE stack serves, by natural key. */
export function liveDemoSchoolId(): Promise<string> {
  return liveSqlOne(
    `select document_id from schools where name = 'SchoolTest Demo School A'`,
    'school "SchoolTest Demo School A"',
  );
}

/** The live seeded class, verified against the school via the ops API. */
export async function liveDemoClassId(
  request: APIRequestContext,
  schoolId: string,
  className = 'EAL/D Year 7 - Room 4',
): Promise<string> {
  const id = await liveSqlOne(
    `select document_id from classes where name = '${className.replace(/'/g, "''")}'`,
    `class "${className}"`,
  );
  const jwt = await apiJwt(request);
  const res = await request.get(`${API}/api/ops/schools/${schoolId}/classes?page=1&pageSize=200`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(res.ok(), await res.text()).toBeTruthy();
  const names = ((await res.json()) as { data: { documentId: string; name: string }[] }).data;
  expect(
    names.some((klass) => klass.documentId === id),
    `class ${className} must belong to school ${schoolId}`,
  ).toBe(true);
  return id;
}

/* ------------------------------------------------------------------ *
 * API plumbing
 * ------------------------------------------------------------------ */

export function apiJwt(request: APIRequestContext): Promise<string> {
  return loginCached(request, API, OPS_API);
}

export interface OpsSchoolDetail {
  documentId: string;
  name: string;
  student_count: number;
  class_count: number;
  portal_status: string;
}

export async function schoolDetail(
  request: APIRequestContext,
  jwt: string,
  schoolId: string,
): Promise<OpsSchoolDetail> {
  const res = await request.get(`${API}/api/ops/schools/${schoolId}`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(res.ok(), await res.text()).toBeTruthy();
  return ((await res.json()) as { data: OpsSchoolDetail }).data;
}

export interface Entitlement {
  seats_total: number;
  seats_used: number;
  seats_remaining: number;
}

export async function entitlement(
  request: APIRequestContext,
  jwt: string,
  schoolId: string,
): Promise<Entitlement> {
  const res = await request.get(`${API}/api/schools/${schoolId}/entitlement`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(res.ok(), await res.text()).toBeTruthy();
  return (await res.json()).data as Entitlement;
}

/** The students list the portal itself reads (C-OPS-PORTAL-035 contract). */
export async function studentsList(
  request: APIRequestContext,
  jwt: string,
  schoolId: string,
  params: Record<string, string | number | undefined> = {},
): Promise<{ data: { documentId: string; email: string | null; given_name: string; family_name: string; student_status: string }[]; meta: { pagination: { total: number } } }> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) query.set(key, String(value));
  }
  const res = await request.get(
    `${API}/api/ops/schools/${schoolId}/students?${query.toString()}`,
    { headers: { Authorization: `Bearer ${jwt}` } },
  );
  expect(res.ok(), await res.text()).toBeTruthy();
  return (await res.json()) as never;
}

/* ------------------------------------------------------------------ *
 * Browser plumbing
 * ------------------------------------------------------------------ */

export async function signInAsOps(page: Page): Promise<void> {
  await page.goto('/sign-in');
  await page
    .getByLabel(cat(en, 'Auth.portal.emailLabel'), { exact: true })
    .fill(OPS.email, { timeout: 30_000 });
  await page
    .getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true })
    .fill(OPS.password, { timeout: 30_000 });
  await page
    .getByRole('button', { name: cat(en, 'Auth.portal.loginButton'), exact: true })
    .click({ timeout: 30_000 });
  // The SETTLED role landing, never the transient /dashboard hop.
  await page.waitForURL('**/dashboard/ops/schools', { timeout: 90_000 });
}

export async function openStudentsTab(page: Page, schoolId: string): Promise<void> {
  await page.goto(`/dashboard/ops/schools/${schoolId}?tab=students`);
  await expect(page.getByRole('tabpanel', { name: 'Students' })).toBeVisible({ timeout: 30_000 });
}

/**
 * The students tab's server-total sentence ("{count} enrolled · showing recent
 * activity") — the redesign dropped the old `ops-students-total` testid.
 */
export function studentsTotalLine(page: Page): ReturnType<Page['getByText']> {
  return page.getByText(/\d+ enrolled · showing recent activity/);
}

/** Every rendered student row (the directory kit stamps each with an index). */
export function studentRows(page: Page): ReturnType<Page['locator']> {
  return page.locator('[data-directory-row-index]');
}

/** The import panel lives INSIDE the modal opened from the Students tab header. */
export async function openImportModal(page: Page, schoolId: string): Promise<Locator> {
  await openStudentsTab(page, schoolId);
  await page
    .getByRole('button', { name: cat(en, 'Ops.schoolTables.studentsImportCta'), exact: true })
    .click({ timeout: 30_000 });
  const panel = page.locator('[data-surface="ops-student-import"]');
  await expect(panel).toBeVisible({ timeout: 30_000 });
  return panel;
}

/** Pick a destination class in the modal (Radix select behind the labelled trigger). */
export async function pickClass(page: Page, className: string): Promise<void> {
  // By id: the visible label carries the required `*` marker, so text matching
  // is fragile; `#ops-import-class` is the trigger the label points at.
  // The OPTIONS are portaled to document.body by the Radix select, so they are
  // sought from the page, never inside the panel locator.
  await page.locator('#ops-import-class').click();
  await page.getByRole('option', { name: className, exact: true }).click();
}

export interface RequestLog {
  urls: string[];
  bodies: string[];
  count(): number;
}

/** Count every request whose URL carries `fragment` (preview/commit loop evidence). */
export function trackRequests(page: Page, fragment: string): RequestLog {
  const log: RequestLog = {
    urls: [],
    bodies: [],
    count: () => log.urls.length,
  };
  page.on('request', (request) => {
    if (request.url().includes(fragment)) {
      log.urls.push(request.url());
      log.bodies.push(request.postData() ?? '');
    }
  });
  return log;
}

/* ------------------------------------------------------------------ *
 * CSV builders — the portal's six-column vocabulary.
 * ------------------------------------------------------------------ */

export const PORTAL_HEADER = 'given name,family name,email,date of birth,year level,home language';

export function portalRow(given: string, family: string, email: string): string {
  return `${given},${family},${email},2013-03-04,8,english`;
}
