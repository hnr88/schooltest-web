import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { expect, type APIRequestContext, type Page } from '@playwright/test';

import { cat, loadMessages } from './i18n';
import { apiEnv } from './auth-db';
import { namedRetry } from './api-named-retry';

/**
 * Fleet 5 live helpers — scratch support for tests/e2e/fleet5-*.spec.ts.
 * Live-school-admin student-surface probes. Everything here talks to the REAL
 * running stack (web :3002, API :5500, Mailpit :8125); servers are NEVER
 * started or restarted here.
 */

export const API = 'http://127.0.0.1:5500';
export const en = loadMessages('en');

/** Unique data stamp for this run: F5-<epoch>. */
export const STAMP = `F5${Date.now()}`;

export const SHOTS = path.resolve(process.cwd(), 'tests/e2e/captures/fleet5');

/** Screenshot into captures/fleet5 with a numbered slug; PNG bytes asserted. */
export async function shot(page: Page, name: string): Promise<void> {
  mkdirSync(SHOTS, { recursive: true });
  const file = path.join(SHOTS, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  const stats = await import('node:fs').then((fs) => fs.promises.stat(file));
  expect(stats.size, `${name}.png is a non-empty screenshot`).toBeGreaterThan(1000);
}

/** Sign in through the REAL /sign-in form as the Demo School A school admin. */
export async function signIn(page: Page): Promise<void> {
  // The shared auth limiter + dev-server compile-on-demand make one attempt
  // flaky under fleet load — the retry re-enters /sign-in fresh each time.
  await namedRetry('fleet5', 'UI sign-in', async () => {
    await page.goto('/sign-in');
    await page.getByLabel(cat(en, 'Auth.portal.emailLabel'), { exact: true }).fill(CREDS.email);
    await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(CREDS.password);
    await page
      .getByRole('button', { name: cat(en, 'Auth.portal.loginButton'), exact: true })
      .click();
    await page.waitForURL('**/dashboard/school', { timeout: 60_000 });
  });
}

export const CREDS = {
  email: 'schooladmin-a@schooltest.local',
  password: 'Schooladmin1234!',
};

export interface ChildRow {
  documentId: string;
  given_name: string | null;
  family_name: string | null;
  student_status: string | null;
  email: string | null;
}

/** API login for the school admin — returns the JWT (restart-window safe). */
export async function apiLogin(request: APIRequestContext): Promise<string> {
  return namedRetry('fleet5', 'sign in via /api/auth/local', async () => {
    const res = await request.post(`${API}/api/auth/local`, {
      data: { identifier: CREDS.email, password: CREDS.password },
    });
    expect(res.ok(), await res.text()).toBeTruthy();
    return ((await res.json()) as { jwt: string }).jwt;
  });
}

function auth(jwt: string): Record<string, string> {
  return { Authorization: `Bearer ${jwt}` };
}

/** GET /api/schools/me/children with query params (restart-window safe). */
export async function apiChildren(
  request: APIRequestContext,
  jwt: string,
  params: string,
): Promise<{ rows: ChildRow[]; total: number }> {
  return namedRetry('fleet5', `read children?${params}`, async () => {
    const res = await request.get(`${API}/api/schools/me/children?${params}`, {
      headers: auth(jwt),
    });
    expect(res.ok(), await res.text()).toBeTruthy();
    const body = (await res.json()) as {
      data: ChildRow[];
      meta: { pagination: { total: number } };
    };
    return { rows: body.data, total: body.meta.pagination.total };
  });
}

/** GET one student (C-CHD-06); returns the raw data row (restart-window safe). */
export async function apiChild(
  request: APIRequestContext,
  jwt: string,
  documentId: string,
): Promise<Record<string, unknown> & { student_status?: string }> {
  return namedRetry('fleet5', `read child ${documentId}`, async () => {
    const res = await request.get(`${API}/api/schools/me/children/${documentId}`, {
      headers: auth(jwt),
    });
    expect(res.ok(), await res.text()).toBeTruthy();
    return ((await res.json()) as { data: Record<string, unknown> }).data;
  });
}

/** POST create a student through the live API (school-admin surface). */
export async function apiCreateStudent(
  request: APIRequestContext,
  jwt: string,
  body: Record<string, unknown>,
): Promise<{ status: number; data: (ChildRow & Record<string, unknown>) | null; error: unknown }> {
  return namedRetry('fleet5', 'create student via API', async () => {
    const res = await request.post(`${API}/api/schools/me/children`, {
      headers: auth(jwt),
      data: body,
    });
    const text = await res.text();
    let parsed: { data?: ChildRow & Record<string, unknown>; error?: unknown } = {};
    try {
      parsed = JSON.parse(text) as typeof parsed;
    } catch {
      parsed = {};
    }
    return { status: res.status(), data: parsed.data ?? null, error: parsed.error ?? text };
  });
}

/** POST archive / unarchive on the school-admin surface (restart-window safe). */
export async function apiArchive(
  request: APIRequestContext,
  jwt: string,
  documentId: string,
  action: 'archive' | 'unarchive',
): Promise<number> {
  return namedRetry('fleet5', `${action} ${documentId}`, async () => {
    const res = await request.post(
      `${API}/api/schools/me/children/${documentId}/${action}`,
      { headers: auth(jwt), data: {} },
    );
    return res.status();
  });
}

export interface StudentUserLink {
  student_doc: string;
  user_doc: string;
  username: string;
  email: string;
  provider: string;
  confirmed: boolean;
  role_type: string;
  has_password: boolean;
}

/**
 * Read the student → users-permissions account link from the LIVE database the
 * API serves (127.0.0.1:5540 — NOT the stale schooltest-api-st1-postgres
 * container; see the class-student drill-down finding). Read-only.
 *
 * This is the DIRECT evidence for today's create-time provisioning change
 * (schooltest-api/src/bootstrap/student-provisioning-middlewares.ts): every
 * created Student must own a linked, confirmed, passwordless student-role user.
 */
export async function dbStudentUserLink(studentDocumentId: string): Promise<StudentUserLink | null> {
  const requireFrom = (await import('node:module')).createRequire(__filename);
  const pg = requireFrom('/home/hnr/Code/schooltest/schooltest-api/node_modules/pg') as {
    Client: new (config: Record<string, unknown>) => {
      connect(): Promise<void>;
      query(sql: string, values?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
      end(): Promise<void>;
    };
  };
  const client = new pg.Client({
    host: '127.0.0.1',
    port: Number(apiEnv('DATABASE_PORT')),
    user: apiEnv('DATABASE_USERNAME'),
    password: apiEnv('DATABASE_PASSWORD'),
    database: apiEnv('DATABASE_NAME'),
  });
  try {
    await client.connect();
    const result = await client.query(
      `select s.document_id as student_doc, u.document_id as user_doc, u.username, u.email,
              u.provider, u.confirmed, r.type as role_type, (u.password is not null) as has_password
         from students s
         left join students_user_lnk l on l.student_id = s.id
         left join up_users u on u.id = l.user_id
         left join up_users_role_lnk rl on rl.user_id = u.id
         left join up_roles r on r.id = rl.role_id
        where s.document_id = $1`,
      [studentDocumentId],
    );
    return (result.rows[0] as unknown as StudentUserLink) ?? null;
  } finally {
    await client.end();
  }
}

/**
 * Console-noise filter for watchErrors(): dev-mode Next + expected 404 fetches
 * (the bogus-documentId probe) are not defects. Pageerrors are NEVER filtered.
 */
export function realErrors(errors: readonly string[]): string[] {
  return errors.filter((message) => {
    if (message.startsWith('pageerror:')) return true;
    return !/Failed to load resource|Download the React DevTools|Fast Refresh|sourcemap|Source map/i.test(
      message,
    );
  });
}
