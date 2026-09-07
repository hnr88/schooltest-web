/**
 * OPS-073 (web) — the REAL rows the ops recovery panel operates on.
 *
 * The browser flow is the subject of the spec, so the arrangement happens over
 * HTTP against the same running Strapi the app talks to: the seeded teacher
 * opens a progress sitting on the demo school's own class and mints its board
 * code, and ops reads the outcome back afterwards. Ids are RESOLVED, never
 * pinned — Strapi generates documentIds, so a pinned one asserts an accident of
 * one database rather than a contract.
 */
import { expect, type APIRequestContext, type Locator, type Page } from '@playwright/test';

import { fixtureTeacherCredentials, roleCredentials } from './credentials';
import { FIXTURE_SCHOOL_NAME } from './fixture-ids';
import { cat, loadMessages } from './i18n';
import { fetchWithRetry, loginCached } from './http';

const en = loadMessages('en');

/** Every interaction is bounded: an unbounded wait on a hidden element hangs. */
export const ACTION_TIMEOUT = 20_000;

export function apiBaseUrl(): string {
  return (
    process.env.E2E_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:5500'
  );
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * The API's fixed-window rate limit is per IP and shared with every other suite
 * on this machine, and Strapi runs in `develop` mode, whose watcher restarts the
 * worker on any repo change. Both show up on the login call — as an HTTP 429 or
 * as a transport error — and both are transient. `loginCached` drops a rejected
 * entry, so each attempt is a fresh login; anything else fails immediately.
 */
async function rideOut<T>(call: () => Promise<T>, attempts = 8): Promise<T> {
  const transient = ['429', 'ECONNREFUSED', 'ECONNRESET', 'socket hang up'];
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await call();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (attempt >= attempts || !transient.some((hint) => message.includes(hint))) throw error;
      await sleep(15_000);
    }
  }
}

export function opsJwt(request: APIRequestContext): Promise<string> {
  return rideOut(() => loginCached(request, apiBaseUrl(), roleCredentials('opsApi')));
}

export function teacherJwt(request: APIRequestContext): Promise<string> {
  return rideOut(() => loginCached(request, apiBaseUrl(), fixtureTeacherCredentials()));
}

const auth = (jwt: string): Record<string, string> => ({ Authorization: `Bearer ${jwt}` });

/**
 * The seeded demo school and its OLDEST class — the seeded one. Resolved rather
 * than pinned: Strapi generates documentIds, and class NAMES differ between
 * stacks, so `createdAt:asc` is the only identity that survives both.
 */
export async function resolveTargets(
  request: APIRequestContext,
  jwt: string,
): Promise<{ schoolDocumentId: string; classDocumentId: string }> {
  const schools = await fetchWithRetry(() =>
    request.get(`${apiBaseUrl()}/api/schools`, {
      headers: auth(jwt),
      params: { 'filters[name][$eq]': FIXTURE_SCHOOL_NAME, 'fields[0]': 'name' },
    }),
  );
  expect(schools.status(), await schools.text()).toBe(200);
  const school = ((await schools.json()) as { data: Array<{ documentId: string }> }).data[0];
  expect(school, `seeded school "${FIXTURE_SCHOOL_NAME}"`).toBeTruthy();

  const classes = await fetchWithRetry(() =>
    request.get(`${apiBaseUrl()}/api/classes`, {
      headers: auth(jwt),
      params: {
        'filters[school][documentId][$eq]': school.documentId,
        'fields[0]': 'name',
        sort: 'createdAt:asc',
        'pagination[pageSize]': 1,
      },
    }),
  );
  expect(classes.status(), await classes.text()).toBe(200);
  const klass = ((await classes.json()) as { data: Array<{ documentId: string }> }).data[0];
  expect(klass, `a class in "${FIXTURE_SCHOOL_NAME}"`).toBeTruthy();

  return { schoolDocumentId: school.documentId, classDocumentId: klass.documentId };
}

/** Opens a progress sitting as the fixture teacher and mints its board code. */
export async function openSitting(
  request: APIRequestContext,
  jwt: string,
  classDocumentId: string,
): Promise<{ documentId: string; code: string }> {
  const created = await fetchWithRetry(() =>
    request.post(`${apiBaseUrl()}/api/sittings`, {
      headers: auth(jwt),
      data: { data: { class_document_id: classDocumentId, mode: 'progress', skill: 'reading' } },
    }),
  );
  expect(created.status(), await created.text()).toBe(201);
  const documentId = ((await created.json()) as { data: { documentId: string } }).data.documentId;

  const minted = await fetchWithRetry(() =>
    request.post(`${apiBaseUrl()}/api/sittings/${documentId}/code`, { headers: auth(jwt) }),
  );
  expect(minted.ok(), await minted.text()).toBeTruthy();
  return { documentId, code: ((await minted.json()) as { code: string }).code };
}

/** The stored sitting status, read back through an authorized ops request. */
export async function readSittingStatus(
  request: APIRequestContext,
  jwt: string,
  documentId: string,
): Promise<string> {
  const res = await fetchWithRetry(() =>
    request.get(`${apiBaseUrl()}/api/sittings/${documentId}`, {
      headers: auth(jwt),
      params: { 'fields[0]': 'status' },
    }),
  );
  expect(res.status(), await res.text()).toBe(200);
  return ((await res.json()) as { data: { status: string } }).data.status;
}

/** Removes a sitting this spec created, so the picker stays representative. */
export async function deleteSitting(
  request: APIRequestContext,
  jwt: string,
  documentId: string,
): Promise<void> {
  await fetchWithRetry(() =>
    request.delete(`${apiBaseUrl()}/api/sittings/${documentId}`, { headers: auth(jwt) }),
  );
}

/**
 * Signs in and waits for the SETTLED ops landing, not the transient /dashboard
 * hop, so a late role redirect cannot hijack the goto that follows.
 *
 * The submit is retried: the API's per-IP rate limit is shared with every other
 * suite on this machine, and the axios ride-out covers reads only — a 429 on the
 * login POST surfaces as a form error and leaves the browser on /sign-in.
 */
export async function signInAsOps(page: Page): Promise<void> {
  const { email, password } = roleCredentials('opsApi');
  for (let attempt = 1; ; attempt += 1) {
    await page.goto('/sign-in');
    await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(email);
    await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(password);
    await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
    try {
      await page.waitForURL('**/dashboard/ops/schools', { timeout: 45_000 });
      return;
    } catch {
      if (attempt >= 4) {
        throw new Error(`sign-in never reached the ops landing (stuck at ${page.url()})`);
      }
      await page.waitForTimeout(20_000);
    }
  }
}

/** Opens the school detail and selects the sitting whose board code is `code`. */
export async function selectSitting(
  page: Page,
  schoolDocumentId: string,
  code: string,
): Promise<{ panel: Locator; detail: Locator }> {
  await page.goto(`/dashboard/ops/schools/${schoolDocumentId}`);
  const panel = page.locator('[data-surface="ops-sitting-recovery"]');
  await expect(panel).toBeVisible({ timeout: ACTION_TIMEOUT });
  await panel
    .getByLabel(cat(en, 'Ops.recovery.pickerLabel'), { exact: true })
    .click({ timeout: ACTION_TIMEOUT });
  await page.getByRole('option', { name: new RegExp(code) }).click({ timeout: ACTION_TIMEOUT });
  const detail = panel.locator('[data-surface="ops-sitting-recovery-detail"]');
  await expect(detail).toBeVisible({ timeout: ACTION_TIMEOUT });
  return { panel, detail };
}

/** The panel's destructive action, by its catalog label. */
export const invalidateButton = (detail: Locator): Locator =>
  detail.getByRole('button', { name: cat(en, 'Ops.recovery.invalidateButton'), exact: true });
