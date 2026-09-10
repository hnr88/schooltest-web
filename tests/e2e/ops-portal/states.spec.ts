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
 * here because they had no backing production path in the ops portal:
 *  - the `?error=session` sign-in overlay: use-require-ops.ts redirects to a
 *    PLAIN /sign-in (no query), so the overlay is unreachable from ops;
 *  - (formerly) the offline banner — the shell had no such surface until
 *    mvp/ops task 04 shipped `OpsPortalCapabilities`' offline strip; the two
 *    `offline strip` tests below now pin it for real.
 *
 * NOTE (mvp/ops task 04): the `restricted:` test below pins ONLY the
 * ops_support read-only banner — the chrome this task ships. The ops_support
 * read/write matrix (which tabs and reads render for a support session) is
 * owned END TO END by task 28 (`After: 04,41,42`); it was transferred there
 * explicitly when this file's former Classes-tab assertions proved to be that
 * task's surface, not this one's.
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import { expect, test, type APIRequestContext, type Page, type Route } from '@playwright/test';
import { OPS_PORTAL_VERSION_HEADER } from '@schooltest/ops-contracts';

import { cat, loadMessages } from '../helpers/i18n';
import {
  INVALID_TOKEN,
  OpsFixturePrerequisiteError,
  fixtureAuthContext,
} from '../helpers/ops-portal';
import { loginAs } from '../helpers/roles';

const en = loadMessages('en');
const AUTH_TOKEN_KEY = 'app.auth.token';
const ACTION_TIMEOUT = 20_000;
const SCHOOL_A_NAME = 'SchoolTest Demo School A';
const CLASSES_GLOB = '**/api/ops/schools/*/classes*';
const SHOTS = path.resolve(__dirname, '../../../../mvp/ops/proof/shots');
const VIEWPORT = { width: 1440, height: 900 };

async function shot(page: Page, name: string): Promise<void> {
  await mkdir(SHOTS, { recursive: true });
  await page.screenshot({ path: path.join(SHOTS, name) });
}

const railLink = (page: Page, href: string) =>
  page.locator(`a[data-sidebar="menu-button"][href="${href}"]`);

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
  // The seed now carries 314 schools (105 pages), so the fixture school is no
  // longer on page 1 — read it through the list's OWN `q` search instead of
  // paging (task 04 helper repair; the route and filters are the endpoint's).
  const res = await request.get(
    `${process.env.E2E_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:5500'}/api/ops/schools?q=${encodeURIComponent(name)}`,
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
    // empty surface is asserted structurally, not by message text. The
    // design-system EmptyState renders its title as a <p>, never a heading —
    // assert its stable data-slot (task-04 re-point; was getByRole('heading')).
    await expect(tab.getByTestId('ops-classes-row')).toHaveCount(0, { timeout: ACTION_TIMEOUT });
    await expect(tab.locator('[data-slot="empty-state"]').first()).toBeVisible({
      timeout: ACTION_TIMEOUT,
    });
  });

  test('empty: no rows and a next-action surface when the list is empty', async ({ page, request }) => {
    await page.route(CLASSES_GLOB, fulfilling(listBody([])));
    await signedIn(page, request);
    const tab = await openClassesTab(page, request);
    await expect(tab.getByTestId('ops-classes-row')).toHaveCount(0, { timeout: ACTION_TIMEOUT });
    await expect(tab.locator('[data-slot="empty-state"]').first()).toBeVisible({
      timeout: ACTION_TIMEOUT,
    });
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

  test('restricted: ops_support sees the read-only banner', async ({ page, request }) => {
    // Task 04 pins ONLY the read-only banner — the strip this task's chrome
    // ships. The ops_support read/write matrix (which tabs and reads render
    // for a support session) transferred END TO END to task 28 (`ops_support`:
    // the rail, and the read-only sweep — After: 04,41,42; D-19/D-31) by
    // explicit orchestrator ruling: the former Classes-tab assertions here
    // were that task's and they left with it. Explicit transfer, not a
    // weakened assertion.
    await supportSignedIn(page, request);
    await page.goto('/dashboard/ops/schools').then(() => undefined);
    await expect(
      page.locator('[data-slot="ops-capabilities-read-only"][data-ops-role="ops_support"]'),
    ).toBeVisible({ timeout: ACTION_TIMEOUT });
  });

  test('expired: a boot-invalid token renders the wall over the guard and never redirects', async ({
    page,
  }) => {
    // GAP-6 as shipped: the committed boundary raises the sessionExpired flag
    // on the first auth-invalid response and useRequireOps stops
    // bounce-redirecting while it stands — the wall IS the expired state, for
    // a boot-invalid token exactly as for a mid-session one (the rail suite's
    // `expired wall:` test pins that second, kept-tree path). The old redirect
    // expectation contradicted the Keeps-working rule it sat under; corrected
    // to the current task contract by orchestrator ruling. No auth change.
    await seedToken(page, INVALID_TOKEN);
    await page.goto('/dashboard/ops').then(() => undefined);
    await expect(page.locator('[data-slot="ops-session-expired"]')).toBeVisible({
      timeout: ACTION_TIMEOUT,
    });
    await expect(page).not.toHaveURL(/sign-in/, { timeout: ACTION_TIMEOUT });
  });
});

// mvp/ops task 04 (Ops Portal.dc.html:51-58): the offline strip, driven by the
// browser's own online/offline events through useOnlineStatus — no canned UI
// state, the context actually leaves the network. Both tests drive the schools
// list (a surviving route) directly — no fixture-school dependency.
test.describe('offline strip', () => {
  test('going offline renders the strip with Retry connection; coming back removes it without a reload', async ({
    page,
    request,
  }) => {
    await page.setViewportSize(VIEWPORT);
    await signedIn(page, request);
    await page.goto('/dashboard/ops/schools').then(() => undefined);
    // Go offline only once the page is FULLY interactive: the rail link is a
    // client-rendered element, so its visibility proves hydration finished and
    // the chunk graph is loaded — cutting the network mid-chunk would kill
    // hydration itself and no hook could ever observe the offline event.
    await expect(railLink(page, '/dashboard/ops/schools')).toBeVisible({
      timeout: ACTION_TIMEOUT,
    });
    await expect(page.locator('[data-slot="ops-offline-strip"]')).toHaveCount(0, {
      timeout: ACTION_TIMEOUT,
    });

    // A marker set before going offline must survive the whole episode: the
    // strip has to clear through the online EVENT, never through a reload.
    await page.evaluate(() => {
      (window as { __offlineProbe?: number }).__offlineProbe = 1;
    });

    await page.context().setOffline(true);
    const strip = page.locator('[data-slot="ops-offline-strip"]');
    await expect(strip).toBeVisible({ timeout: ACTION_TIMEOUT });
    await expect(strip.locator('[data-slot="ops-offline-retry"]')).toBeVisible();
    await expect(strip).toContainText(cat(en, 'Ops.capabilities.offlineRetry'));
    await shot(page, '04-offline-strip.png');

    await page.context().setOffline(false);
    await expect(page.locator('[data-slot="ops-offline-strip"]')).toBeHidden({
      timeout: ACTION_TIMEOUT,
    });
    expect(
      await page.evaluate(() => (window as { __offlineProbe?: number }).__offlineProbe),
    ).toBe(1);
  });

  test('offline outranks read-only: a support session sees the offline strip, not the read-only one', async ({
    page,
    request,
  }) => {
    await supportSignedIn(page, request);
    await page.goto('/dashboard/ops/schools').then(() => undefined);
    const readOnly = page.locator('[data-slot="ops-capabilities-read-only"]');
    await expect(readOnly).toBeVisible({ timeout: ACTION_TIMEOUT });

    await page.context().setOffline(true);
    await expect(page.locator('[data-slot="ops-offline-strip"]')).toBeVisible({
      timeout: ACTION_TIMEOUT,
    });
    await expect(readOnly).toBeHidden();
  });
});

// mvp/ops task 04 — R-01…R-06 and R-26 (Ops Portal.dc.html:25-47, 49-66):
// the rail is the design's two-region layout, and the dashboard topbar is
// gated out of /dashboard/ops/** — asserted per portal, never assumed.
test.describe('ops rail and topbar gate', () => {
  test('the rail is the two-region design: one Operations entry, one Account entry, five consoles gone', async ({
    page,
  }) => {
    await page.setViewportSize(VIEWPORT);
    await loginAs(page, 'ops');
    await page.goto('/dashboard/ops/schools');

    // PRIMARY region — exactly one Operations entry, named Schools, inside the
    // scroll content and nowhere else.
    await expect(railLink(page, '/dashboard/ops/schools')).toHaveCount(1);
    await expect(railLink(page, '/dashboard/ops/schools')).toContainText(
      cat(en, 'Shell.nav.opsSchools'),
    );
    // ACCOUNT region — exactly one Settings entry, in the footer nav.
    await expect(
      page.locator('[data-slot="sidebar-footer"] a[data-sidebar="menu-button"][href="/dashboard/ops/settings"]'),
    ).toHaveCount(1);
    await expect(railLink(page, '/dashboard/ops/settings')).toContainText(
      cat(en, 'Shell.nav.opsSettings'),
    );
    // The five retired console destinations are absent from every region.
    for (const dest of ['timers', 'system', 'audit', 'comms', 'flags']) {
      await expect(railLink(page, `/dashboard/ops/${dest}`)).toHaveCount(0);
    }
    // R-26: no bell block and no breadcrumb row above the ops page body.
    await expect(page.locator('[data-slot="topbar-actions"]')).toHaveCount(0);
    await expect(
      page.getByRole('navigation', { name: cat(en, 'Shell.topbar.breadcrumbLabel') }),
    ).toHaveCount(0);

    await shot(page, '04-rail.png');
  });

  test('below md the rail collapses to a sheet; SidebarTrigger opens it and both entries mount', async ({
    page,
  }) => {
    await loginAs(page, 'ops');
    await page.setViewportSize({ width: 767, height: 900 });
    await page.goto('/dashboard/ops/schools');

    // The sheet unmounts its items while shut (ops-nav.spec:154-159 pattern).
    await expect(railLink(page, '/dashboard/ops/schools')).toHaveCount(0);
    await page.getByRole('button', { name: cat(en, 'Shell.topbar.toggleNav') }).click();
    await expect(railLink(page, '/dashboard/ops/schools')).toBeVisible();
    await expect(railLink(page, '/dashboard/ops/settings')).toBeVisible();

    await shot(page, '04-rail-sheet-md.png');
  });

  test('expired wall: a mid-session invalidation renders the wall over the kept tree', async ({
    page,
    request,
  }) => {
    await page.setViewportSize(VIEWPORT);
    await signedIn(page, request);
    await page.goto('/dashboard/ops/schools');
    await expect(railLink(page, '/dashboard/ops/schools')).toBeVisible({ timeout: ACTION_TIMEOUT });

    // Kill the token the way a server-side revocation would, then force a
    // client-side read: the boundary raises the flag and the wall renders —
    // no redirect, no reload, the kept tree still beneath it.
    await page.evaluate(([key]) => {
      window.localStorage.setItem(key, 'invalid-token-for-task-04-wall');
    }, [AUTH_TOKEN_KEY]);
    await railLink(page, '/dashboard/ops/settings').click();
    const wall = page.locator('[data-slot="ops-session-expired"]');
    await expect(wall).toBeVisible({ timeout: ACTION_TIMEOUT });
    await expect(page).not.toHaveURL(/sign-in/);
    // D-14: the configured timeout, never the design's sample 30 minutes —
    // or the honest no-number sentence if the read never answered.
    await expect(wall).not.toContainText('after 30 minutes');

    await shot(page, '04-expired-wall.png');
  });

  for (const [role, path, shotName] of [
    ['schoolAdmin', '/dashboard/school', '04-school-topbar-intact.png'],
    ['teacher', '/dashboard', '04-teacher-topbar-intact.png'],
    ['parent', '/dashboard', '04-parent-topbar-intact.png'],
  ] as const) {
    test(`R-26 gated, not deleted: the ${role} portal keeps its topbar, crumb trail and bell`, async ({
      page,
    }) => {
      await page.setViewportSize(VIEWPORT);
      await loginAs(page, role);
      await page.goto(path);
      await expect(page.locator('[data-slot="topbar-actions"]')).toBeVisible({
        timeout: ACTION_TIMEOUT,
      });
      await expect(
        page.getByRole('navigation', { name: cat(en, 'Shell.topbar.breadcrumbLabel') }),
      ).toBeVisible({ timeout: ACTION_TIMEOUT });

      await shot(page, shotName);
    });
  }
});
