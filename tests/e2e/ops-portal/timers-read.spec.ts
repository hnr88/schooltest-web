/**
 * OPS-080 — the ops Timers screen reads C-OPS-PORTAL-070 and shows the ACTUAL
 * active configuration. Opens the screen as ops and proves the rendered minutes
 * are the ones the live API serves, not a value the component invented, parsed
 * through the SHARED contract schema. The declared edge cases (duplicate/missing stage, a
 * non-whole-minute stored value, an empty set, a network failure) are driven by
 * intercepting the one portal request. Every interaction is bounded by a
 * timeout — Playwright otherwise waits forever on a hidden element.
 *
 * The screen is opened with the REAL ops JWT the live API issues, seeded into
 * the storage key the app itself writes — one POST /api/auth/local for the
 * whole file. The form path is covered by the sign-in suites; repeating it per
 * test here only spent the API's 20/minute auth budget, which neighbouring
 * suites on this shared stack already contend for.
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import { expect, test, type APIRequestContext, type Page, type Route } from '@playwright/test';
import {
  OPS_PORTAL_VERSION,
  OPS_PORTAL_VERSION_HEADER,
  TIMER_STAGES,
  sectionTimersSchema,
  timerMinutesFromSeconds,
} from '@schooltest/ops-contracts';

import { cat, loadMessages } from '../helpers/i18n';
import { fixtureAuthContext, fixtureHeaders } from '../helpers/ops-portal';

const AUTH_TOKEN_KEY = 'app.auth.token';

const RETRY_LABEL = cat(loadMessages('en'), 'Ops.timers.retry');
const TIMERS_PATH = '/dashboard/ops/timers';
const API_ROUTE = '**/api/config/section-timers*';
const SURFACE = '[data-surface="ops-section-timers"]';
const ACTIVE = '[data-surface="ops-timers-active"]';
const WARNING = '[data-surface="ops-timers-range-warning"]';
const ACTION_TIMEOUT = 20_000;
const CAPTURES = path.resolve(
  __dirname,
  '../../../../.codephant/missions/msn-ab5a6a54-f385-42e1-826a-aeba2bbdbc66/captures',
);

const apiBaseUrl = (): string =>
  process.env.E2E_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:5500';

/**
 * A fulfilled cross-origin response still faces the browser's CORS check, and
 * the versioned request carries a custom header, so the preflight is answered
 * too — otherwise every intercept below would surface as a generic network
 * failure and "pass" for the wrong reason.
 */
function fulfilling(body: unknown, status = 200) {
  return async (route: Route): Promise<void> => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-methods': 'GET,OPTIONS',
          'access-control-allow-headers': `authorization,content-type,${OPS_PORTAL_VERSION_HEADER}`,
          'access-control-max-age': '0',
        },
      });
      return;
    }
    await route.fulfill({
      status,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify(body),
    });
  };
}

const sectionsBody = (sections: { stage: number; duration_seconds: number }[]) => ({
  data: { sections },
});

// One live login for the file. The API's brute-force guard allows 20 POST
// /api/auth/local per minute per IP and neighbouring suites share that budget,
// so a login per test strands the app on /sign-in with perfect credentials.
let opsJwt: string | null = null;

async function opsToken(request: APIRequestContext): Promise<string> {
  if (opsJwt) return opsJwt;
  let lastError: unknown;
  // A Strapi dev reload (a neighbouring suite touching the API's src/) answers
  // ECONNREFUSED for tens of seconds; the login window has to outlast one.
  for (let attempt = 0; attempt < 12; attempt += 1) {
    try {
      const context = await fixtureAuthContext(request, 'ops');
      if (!context.jwt) throw new Error('[timers-read] the ops login returned no jwt');
      opsJwt = context.jwt;
      return opsJwt;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 8000));
    }
  }
  throw lastError ?? new Error('[timers-read] could not obtain an ops jwt');
}

/** Answers only once the shared API is serving again after a dev reload. */
async function waitForApi(request: APIRequestContext): Promise<void> {
  for (let attempt = 0; attempt < 24; attempt += 1) {
    try {
      const res = await request.get(`${apiBaseUrl()}/api/readiness`);
      if (res.ok()) return;
    } catch {
      // ECONNREFUSED while a neighbouring suite's edit reloads the dev server.
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}

async function openTimers(page: Page, request: APIRequestContext): Promise<void> {
  const jwt = await opsToken(request);
  await page.addInitScript(
    ([key, token]) => window.localStorage.setItem(key, token),
    [AUTH_TOKEN_KEY, jwt] as const,
  );
  let seen = '<no main element>';
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.goto(TIMERS_PATH);
    try {
      await expect(page.locator(SURFACE)).toBeVisible({ timeout: ACTION_TIMEOUT });
      return;
    } catch {
      // "element not found" alone cannot tell a guard redirect from an error
      // state from a render failure, and on a shared stack that difference is
      // the whole diagnosis. The ops guard also sits in its pending skeleton
      // while /api/users/me has nothing to answer it, so wait for the API.
      seen = await page
        .locator('main')
        .first()
        .innerText()
        .catch(() => '<no main element>');
      await waitForApi(request);
    }
  }
  throw new Error(
    `[timers-read] the timers surface never rendered — url=${page.url()} main=${seen.slice(0, 300)}`,
  );
}

test.describe.configure({ mode: 'serial' });

test.describe('OPS-080 the Timers route displays the active configuration', () => {
  test.beforeAll(async () => {
    await mkdir(CAPTURES, { recursive: true });
  });

  test.beforeEach(() => {
    test.setTimeout(180_000);
  });

  test('the rendered rows are the values the API actually serves', async ({ page, request }) => {
    const sent: (string | undefined)[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/api/config/section-timers')) {
        sent.push(req.headers()[OPS_PORTAL_VERSION_HEADER.toLowerCase()]);
      }
    });
    await openTimers(page, request);

    const context = await fixtureAuthContext(request, 'ops');
    const apiRes = await request.get(`${apiBaseUrl()}/api/config/section-timers`, {
      headers: fixtureHeaders('ops', context.jwt ?? undefined),
    });
    expect(apiRes.status(), await apiRes.text()).toBe(200);
    const served = sectionTimersSchema.parse(((await apiRes.json()) as { data: unknown }).data);

    const rows = page.locator(`${ACTIVE} [data-timer-stage]`);
    await expect(rows).toHaveCount(TIMER_STAGES.length, { timeout: ACTION_TIMEOUT });
    for (const [index, section] of served.sections.entries()) {
      const row = rows.nth(index);
      const minutes = timerMinutesFromSeconds(section.duration_seconds);
      await expect(row).toHaveAttribute('data-timer-stage', String(section.stage));
      await expect(row).toHaveAttribute('data-timer-seconds', String(section.duration_seconds));
      await expect(row).toHaveAttribute('data-timer-minutes', minutes === null ? '' : `${minutes}`);
      if (minutes === null) continue;
      await expect(row.locator('dd')).toHaveText(new RegExp(`\\b${minutes}\\b`));
      await expect(page.locator(`#ops-timer-section-${section.stage}`)).toHaveValue(`${minutes}`);
    }

    // The screen's read opted into the versioned contract.
    expect(sent.filter((value) => value === OPS_PORTAL_VERSION).length).toBeGreaterThan(0);
    await expect(page.locator(WARNING)).toHaveCount(0);
  });

  test('captures the screen at the reference desktop viewport, 375px and 200% zoom', async ({
    page,
    request,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await openTimers(page, request);
    await expect(page.locator(ACTIVE)).toBeVisible({ timeout: ACTION_TIMEOUT });
    await page.screenshot({ path: path.join(CAPTURES, '080-timers-desktop-1440.png') });

    for (const [name, size] of [
      ['080-timers-mobile-375.png', { width: 375, height: 812 }],
      // 200% browser zoom halves the CSS viewport (WCAG 1.4.10 reflow).
      ['080-timers-zoom-200.png', { width: 720, height: 500 }],
    ] as const) {
      await page.setViewportSize(size);
      await expect(page.locator(ACTIVE)).toBeVisible({ timeout: ACTION_TIMEOUT });
      await page.screenshot({ path: path.join(CAPTURES, name) });
      // Scoped to this screen: a shell-level overflow belongs to another owner.
      const overflow = await page.evaluate((selector) => {
        const surface = document.querySelector(selector);
        return surface ? surface.scrollWidth - surface.clientWidth : -1;
      }, SURFACE);
      expect(overflow, `${name} must not scroll horizontally`).toBeLessThanOrEqual(1);
    }
  });

  test('a non-whole-minute stored value is shown honestly, never rounded', async ({
    page,
    request,
  }) => {
    await openTimers(page, request);
    await page.route(
      API_ROUTE,
      fulfilling(
        sectionsBody([
          { stage: 1, duration_seconds: 90 },
          { stage: 2, duration_seconds: 900 },
          { stage: 3, duration_seconds: 900 },
        ]),
      ),
    );
    await page.reload();

    const row = page.locator(`${ACTIVE} [data-timer-stage="1"]`);
    await expect(row).toBeVisible({ timeout: ACTION_TIMEOUT });
    await expect(row).toHaveAttribute('data-timer-minutes', '');
    await expect(row).toHaveAttribute('data-timer-seconds', '90');
    await expect(row.locator('dd')).toHaveText(/90/);
    await expect(page.locator(WARNING)).toBeVisible({ timeout: ACTION_TIMEOUT });
  });

  test('a refused stage set, a drifted body and a network failure reach the error state', async ({
    page,
    request,
  }) => {
    await openTimers(page, request);
    const retry = page.getByRole('button', { name: RETRY_LABEL, exact: true });
    const refused = {
      data: null,
      error: {
        status: 500,
        name: 'ApplicationError',
        message: 'active Config section_timers carry stage 3 0 time(s)',
        details: {},
      },
    };
    const handlers = [
      // The server refuses to project a stage set it cannot contract (500).
      fulfilling(refused, 500),
      // A 200 that drifts from the contract must not render as a partial screen.
      fulfilling(sectionsBody([])),
      fulfilling(
        sectionsBody([
          { stage: 1, duration_seconds: 900 },
          { stage: 1, duration_seconds: 900 },
          { stage: 2, duration_seconds: 900 },
        ]),
      ),
      // A network failure carries no HTTP status at all.
      async (route: Route) => route.abort('failed'),
    ];

    for (const [index, handler] of handlers.entries()) {
      await page.route(API_ROUTE, handler);
      let reached = false;
      for (let attempt = 0; attempt < 3 && !reached; attempt += 1) {
        await page.reload();
        try {
          await expect(retry).toBeVisible({ timeout: ACTION_TIMEOUT });
          reached = true;
        } catch {
          // The ops guard sits in its pending skeleton while /api/users/me has
          // nothing to answer it, which is the shared stack reloading rather
          // than this state failing to render.
          await waitForApi(request);
        }
      }
      expect(reached, `intercept #${index + 1} never reached the error state`).toBe(true);
      await expect(page.locator(ACTIVE)).toHaveCount(0);
      await page.unroute(API_ROUTE, handler);
    }

    // Retrying once the intercepts are gone recovers the real active configuration.
    await retry.click({ timeout: ACTION_TIMEOUT });
    await expect(page.locator(ACTIVE)).toBeVisible({ timeout: ACTION_TIMEOUT });
    await expect(page.locator(`${ACTIVE} [data-timer-stage]`)).toHaveCount(TIMER_STAGES.length);
  });

  test('a signed-out visitor never reaches the Timers route', async ({ page }) => {
    await page.goto(TIMERS_PATH);
    await page.waitForURL(/\/sign-in/, { timeout: ACTION_TIMEOUT });
    await expect(page.locator(SURFACE)).toHaveCount(0);
  });
});
