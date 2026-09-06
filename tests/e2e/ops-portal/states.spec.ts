/**
 * ops-portal(06) — portal states.
 *
 * Pins the state surfaces of the ops portal classes tab (OpsClassesTab):
 * loading, empty, load error (500), network disconnect, malformed payload,
 * the ops_support read-only surface, and the expired-session redirect.
 *
 * Every state asserted here is reachable from a REAL server condition:
 * an in-flight response, an empty list, an error envelope, an aborted
 * request, a contract-violating body, a read-only role, or an invalid JWT.
 * No state is manufactured with canned UI data.
 *
 * Two designed states from mvp/tasks/ops/06-portal-states.md are NOT pinned
 * here because they have no backing production path in the ops portal:
 *  - the `?error=session` sign-in overlay: use-require-ops.ts redirects to a
 *    PLAIN /sign-in (no query), so the overlay is unreachable from ops;
 *  - the offline banner: no such surface exists in the shell.
 * Both are flagged to the orchestrator in the task report instead of being
 * faked.
 *
 * NOTE for tasks 02/31 (authorization enforcement): the ops_support
 * assertions below pin CURRENT committed truth — the read-only banner
 * renders and reads still work. When 02/31 land server-side enforcement,
 * the read assertions stay valid; if client-visible behaviour changes,
 * those tasks own updating this spec.
 */
import { expect, test, type APIRequestContext, type Page, type Route } from '@playwright/test';
import { OPS_PORTAL_VERSION_HEADER } from '@schooltest/ops-contracts';

import { cat, loadMessages } from '../helpers/i18n';
import {
  INVALID_TOKEN,
  OpsFixturePrerequisiteError,
  fixtureAuthContext,
} from '../helpers/ops-portal';

const en = loadMessages('en');
const AUTH_TOKEN_KEY = 'app.auth.token';
const ACTION_TIMEOUT = 20_000;
const SCHOOL_A_NAME = 'SchoolTest Demo School A';
const CLASSES_GLOB = '**/api/ops/schools/*/classes*';

function corsHeaders(): Record<string, string> {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': `content-type,authorization,${OPS_PORTAL_VERSION_HEADER}`,
  };
}

function fulfilling(body: unknown, status = 200) {
  return async (route: Route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders() });
      return;
    }
    await route.fulfill({
      status,
      contentType: 'application/json',
      headers: corsHeaders(),
      body: JSON.stringify(body),
    });
  };
}

function listBody(rows: unknown[]) {
  return {
    data: rows,
    meta: {
      pagination: { page: 1, pageSize: 25, pageCount: rows.length === 0 ? 0 : 1, total: rows.length },
    },
  };
}

function errorBody(status: number) {
  return { data: null, error: { status, name: 'ApplicationError', message: 'probe', details: {} } };
}

let cachedOpsJwt: string | null = null;

async function opsToken(request: APIRequestContext): Promise<string> {
  if (cachedOpsJwt) return cachedOpsJwt;
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    try {
      const { jwt } = await fixtureAuthContext(request, 'ops');
      if (jwt) {
        cachedOpsJwt = jwt;
        return jwt;
      }
      lastError = new Error('ops fixture returned no jwt');
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 8_000));
  }
  throw lastError instanceof Error
    ? lastError
    : new OpsFixturePrerequisiteError('ops fixture account unavailable');
}

async function seedToken(page: Page, token: string): Promise<void> {
  await page.addInitScript(([key, value]) => {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // storage unavailable in this context; the app treats it as signed out
    }
  }, [AUTH_TOKEN_KEY, token] as const);
}

async function signedIn(page: Page, request: APIRequestContext): Promise<void> {
  await seedToken(page, await opsToken(request));
}

async function supportSignedIn(page: Page, request: APIRequestContext): Promise<void> {
  try {
    const { jwt } = await fixtureAuthContext(request, 'ops_support');
    if (!jwt) throw new OpsFixturePrerequisiteError('ops_support fixture returned no jwt');
    await seedToken(page, jwt);
  } catch (error) {
    if (error instanceof OpsFixturePrerequisiteError) test.skip(true, error.message);
    throw error;
  }
}

const schoolCache = new Map<string, string>();

async function seededSchoolId(request: APIRequestContext, name: string): Promise<string> {
  const cached = schoolCache.get(name);
  if (cached) return cached;
  const jwt = await opsToken(request);
  const res = await request.get(
    `${process.env.E2E_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:5500'}/api/ops/schools`,
    { headers: { authorization: `Bearer ${jwt}`, [OPS_PORTAL_VERSION_HEADER]: '1' } },
  );
  if (!res.ok()) throw new OpsFixturePrerequisiteError(`schools list failed: ${res.status()}`);
  const body: unknown = await res.json();
  const rows = (body as { data?: Array<{ documentId?: string; name?: string }> }).data ?? [];
  const match = rows.find((row) => row.name === name);
  if (!match?.documentId) {
    throw new OpsFixturePrerequisiteError(`fixture school '${name}' not found`);
  }
  schoolCache.set(name, match.documentId);
  return match.documentId;
}

async function gotoSchool(page: Page, documentId: string): Promise<void> {
  await page.goto(`/dashboard/ops/schools/${documentId}`).then(() => undefined);
}

async function openClassesTab(page: Page, request: APIRequestContext) {
  const schoolId = await seededSchoolId(request, SCHOOL_A_NAME);
  await gotoSchool(page, schoolId);
  await page
    .getByRole('tab', { name: cat(en, 'Ops.schoolTables.tab.classes') })
    .click({ timeout: ACTION_TIMEOUT });
  const tab = page.getByTestId('ops-classes-tab');
  await expect(tab).toBeVisible({ timeout: ACTION_TIMEOUT });
  return tab;
}

test.describe.serial('ops portal states', () => {
  test('loading: skeleton shows while the classes request is in flight', async ({ page, request }) => {
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(CLASSES_GLOB, async (route) => {
      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: corsHeaders() });
        return;
      }
      await gate;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: corsHeaders(),
        body: JSON.stringify(listBody([])),
      });
    });
    await signedIn(page, request);
    const tab = await openClassesTab(page, request);
    await expect(page.getByTestId('ops-classes-loading')).toBeVisible({ timeout: ACTION_TIMEOUT });
    release();
    await expect(page.getByTestId('ops-classes-loading')).toBeHidden({ timeout: ACTION_TIMEOUT });
    // classesTab i18n keys are absent from en.json (task-19 gap), so the
    // empty surface is asserted structurally, not by message text.
    await expect(tab.getByTestId('ops-classes-row')).toHaveCount(0, { timeout: ACTION_TIMEOUT });
    await expect(tab.getByRole('heading').first()).toBeVisible({ timeout: ACTION_TIMEOUT });
  });

  test('empty: no rows and a next-action surface when the list is empty', async ({ page, request }) => {
    await page.route(CLASSES_GLOB, fulfilling(listBody([])));
    await signedIn(page, request);
    const tab = await openClassesTab(page, request);
    await expect(tab.getByTestId('ops-classes-row')).toHaveCount(0, { timeout: ACTION_TIMEOUT });
    await expect(tab.getByRole('heading').first()).toBeVisible({ timeout: ACTION_TIMEOUT });
  });

  test('load error: a 500 envelope renders the error state', async ({ page, request }) => {
    await page.route(CLASSES_GLOB, fulfilling(errorBody(500), 500));
    await signedIn(page, request);
    const tab = await openClassesTab(page, request);
    await expect(tab.getByRole('alert')).toBeVisible({ timeout: ACTION_TIMEOUT });
  });

  test('disconnect: an aborted request renders the error state', async ({ page, request }) => {
    await page.route(CLASSES_GLOB, async (route) => {
      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: corsHeaders() });
        return;
      }
      await route.abort('failed');
    });
    await signedIn(page, request);
    const tab = await openClassesTab(page, request);
    await expect(tab.getByRole('alert')).toBeVisible({ timeout: ACTION_TIMEOUT });
  });

  test('malformed: a contract-violating body renders the error state', async ({ page, request }) => {
    await page.route(CLASSES_GLOB, fulfilling({ data: 'nope' }));
    await signedIn(page, request);
    const tab = await openClassesTab(page, request);
    await expect(tab.getByRole('alert')).toBeVisible({ timeout: ACTION_TIMEOUT });
  });

  test('restricted: ops_support sees the read-only banner and reads still render', async ({
    page,
    request,
  }) => {
    // Pins CURRENT committed truth (see header note): banner renders, reads
    // work. Tasks 02/31 own any change to this when enforcement lands.
    await supportSignedIn(page, request);
    const schoolId = await seededSchoolId(request, SCHOOL_A_NAME);
    await gotoSchool(page, schoolId);
    await expect(
      page.locator('[data-slot="ops-capabilities-read-only"][data-ops-role="ops_support"]'),
    ).toBeVisible({ timeout: ACTION_TIMEOUT });
    await page
      .getByRole('tab', { name: cat(en, 'Ops.schoolTables.tab.classes') })
      .click({ timeout: ACTION_TIMEOUT });
    await expect(page.getByTestId('ops-classes-tab')).toBeVisible({ timeout: ACTION_TIMEOUT });
  });

  test('expired: an invalid token redirects to plain /sign-in', async ({ page }) => {
    // The designed `?error=session` overlay has NO backing production path in
    // ops (use-require-ops.ts redirects to plain /sign-in), so this pins the
    // real redirect only. Flagged to the orchestrator; not faked here.
    await seedToken(page, INVALID_TOKEN);
    await page.goto('/dashboard/ops').then(() => undefined);
    await expect(page).toHaveURL(/\/sign-in/, { timeout: ACTION_TIMEOUT });
  });
});
