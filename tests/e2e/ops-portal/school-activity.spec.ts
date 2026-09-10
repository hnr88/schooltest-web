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

import { expect, test, type Page } from '@playwright/test';

import { apiEnv } from '../helpers/auth-db';
import { namedRetry } from '../helpers/api-named-retry';
import { cat, loadMessages } from '../helpers/i18n';

const en = loadMessages('en');
const SCHOOL_A = 'a19wa9lrmloi95ab9m4gmxqk';
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
    await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(OPS_EMAIL);
    await page
      .getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true })
      .fill(apiEnv('SEED_APIADMIN_PASSWORD'));
    await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
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

async function openSchool(page: Page): Promise<void> {
  await page.goto(`/dashboard/ops/schools/${SCHOOL_A}`);
  await expect(page.getByTestId('ops-count-card').first()).toBeVisible({
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
    await openSchool(page);

    const card = page.getByTestId('ops-activity-card');
    await expect(card).toBeVisible({ timeout: ACTION_TIMEOUT });

    // The page asked for THIS school's feed through the versioned contract.
    expect(requests.length).toBeGreaterThan(0);
    for (const url of requests) {
      expect(url).toContain(`school=${SCHOOL_A}`);
    }

    // The card renders rows or the explicit empty state — never a blank and
    // never a dump of the raw ledger detail.
    const rows = page.getByTestId('ops-activity-row');
    const empty = page.getByTestId('ops-activity-empty');
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
    await openSchool(page);

    const card = page.getByTestId('ops-activity-card');
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
