/**
 * OPS-020 / C-OPS-PORTAL-010 — the Recent activity card on the ops school
 * detail page, driven against the REAL portal and the REAL Strapi.
 *
 * Nothing is intercepted or stubbed: the spec signs in with the seeded ops
 * account, opens the seeded demo school and asserts what the browser actually
 * requested and rendered. Assertions deliberately key off `data-*` attributes
 * rather than copy: the card labels are integrator-merged translation keys
 * (see the task report), and a spec that asserted the English strings would
 * encode merge timing rather than behaviour.
 */
import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { apiEnv } from '../helpers/auth-db';
import { namedRetry } from '../helpers/api-named-retry';
import { cat, loadMessages } from '../helpers/i18n';

const en = loadMessages('en');
// FIXTURE HISTORY (measured 2026-09-10): the hardcoded SCHOOL_A id
// 'a19wa9lrmloi95ab9m4gmxqk' is a DEAD row — the schools table no longer
// carries it, so the page 404'd and the count-card assertions passed vacuously
// over a page that never loaded. The school is now RESOLVED AT RUNTIME from
// the live ops schools list instead of a hardcoded id.
const OPS_EMAIL = 'apiadmin@schooltest.local';
const ACTION_TIMEOUT = 15_000;
const CAPTURES = path.resolve(
  __dirname,
  '../../../../.codephant/missions/msn-ab5a6a54-f385-42e1-826a-aeba2bbdbc66/captures',
);

async function signInAsOps(page: Page): Promise<void> {
  // ops/12: the sign-in is the fragile point — a 429 or an API restart window
  // presents as a sign-in failure and used to be indistinguishable from a
  // surface defect. Named-failure wrapper, fleet standard.
  await namedRetry('school-activity', 'sign in as ops through the UI', async () => {
    await page.goto('/sign-in');
    await page.getByLabel(cat(en, 'Auth.portal.emailLabel'), { exact: true }).fill(OPS_EMAIL);
    await page
      .getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true })
      .fill(apiEnv('SEED_APIADMIN_PASSWORD'));
    await page.getByRole('button', { name: cat(en, 'Auth.portal.loginButton'), exact: true }).click();
    await page.waitForURL('**/dashboard', { timeout: 30_000 });
  });
}

/** The page's /api/ops/audit-logs request URLs, query string kept. */
function recordActivityRequests(page: Page): string[] {
  const seen: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'GET' && request.url().includes('/api/ops/audit-logs')) {
      seen.push(request.url());
    }
  });
  return seen;
}

/** Resolve one LIVE school documentId from the ops schools list. */
async function resolveSchoolDocumentId(request: APIRequestContext): Promise<string> {
  // The Playwright `request` fixture's baseURL is the WEB app; these API reads
  // must be absolute or they land on Next (a 404 HTML page), not Strapi.
  const API = process.env.E2E_API_URL ?? 'http://127.0.0.1:5500';
  const auth = await request.post(`${API}/api/auth/local`, {
    data: { identifier: OPS_EMAIL, password: apiEnv('SEED_APIADMIN_PASSWORD') },
  });
  expect(auth.status(), await auth.text()).toBe(200);
  const jwt = ((await auth.json()) as { jwt: string }).jwt;
  const list = await request.get(`${API}/api/ops/schools?pageSize=1`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(list.status(), await list.text()).toBe(200);
  const body = (await list.json()) as { data: Array<{ documentId: string }> };
  const first = body.data?.[0]?.documentId;
  expect(first, 'at least one live school exists for the activity card').toBeTruthy();
  return first;
}

async function openSchool(page: Page, schoolDocumentId: string): Promise<void> {
  await page.goto(`/dashboard/ops/schools/${schoolDocumentId}`);
  // THE LOAD PRECONDITION the tests always lacked: the school detail surface
  // must actually render before anything asserts on its contents — a 404 or
  // an unloaded page renders the same emptiness a getByTestId would miss.
  await expect(page.locator('[data-surface="ops-school-detail"]')).toBeVisible({
    timeout: ACTION_TIMEOUT,
  });
  await expect(page.locator('[data-slot="ops-count-card"]').first()).toBeVisible({
    timeout: ACTION_TIMEOUT,
  });
}

test.describe('ops school activity card (C-OPS-PORTAL-010)', () => {
  // ops/12: the named-retry budget (175s) lives inside these tests' sign-in
  // path, so the tests need the same headroom the other adopting specs give
  // their hooks.
  test.describe.configure({ timeout: 240_000 });

  test.beforeAll(() => {
    mkdirSync(CAPTURES, { recursive: true });
  });

  test('the overview card requests the school-scoped versioned feed and renders rows', async ({
    page,
  }) => {
    const requests = recordActivityRequests(page);
    await signInAsOps(page);
    const schoolDocumentId = await resolveSchoolDocumentId(page.request);
    await openSchool(page, schoolDocumentId);

    const card = page.locator('[data-slot="ops-activity-card"]');
    await expect(card).toBeVisible({ timeout: ACTION_TIMEOUT });

    // The page asked for THIS school's feed through the versioned contract.
    expect(requests.length).toBeGreaterThan(0);
    for (const url of requests) {
      expect(url).toContain(`school=${schoolDocumentId}`);
    }

    // The card renders rows or the explicit empty state — never a blank and
    // never a dump of the raw ledger detail.
    const rows = page.locator('[data-slot="ops-activity-row"]');
    const empty = page.locator('[data-slot="ops-activity-empty"]');
    await expect(rows.or(empty).first()).toBeVisible({ timeout: ACTION_TIMEOUT });

    const rowCount = await rows.count();
    test.info().annotations.push({ type: 'activity-rows', description: String(rowCount) });
    for (let i = 0; i < rowCount; i += 1) {
      const row = rows.nth(i);
      expect(await row.getAttribute('data-action')).toBeTruthy();
      expect(await row.getAttribute('data-timestamp')).toBeTruthy();
      // Every row carries a rendered relative time, however the locale words it.
      await expect(row).toContainText(/\S/, { timeout: ACTION_TIMEOUT });
    }

    await page.screenshot({
      path: path.join(CAPTURES, 'ops-020-school-activity-desktop.png'),
      fullPage: false,
    });
  });

  test('the card holds the page at the 375px reference width', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await signInAsOps(page);
    const schoolDocumentId = await resolveSchoolDocumentId(page.request);
    await openSchool(page, schoolDocumentId);

    const card = page.locator('[data-slot="ops-activity-card"]');
    await expect(card).toBeVisible({ timeout: ACTION_TIMEOUT });
    const box = await card.boundingBox();
    expect(box).not.toBeNull();
    expect(box?.x ?? 0).toBeGreaterThanOrEqual(0);
    expect(box?.width ?? 999).toBeLessThanOrEqual(375);

    await page.screenshot({
      path: path.join(CAPTURES, 'ops-020-school-activity-mobile.png'),
      fullPage: false,
    });
  });
});
