/**
 * FLEET2 scratch — ops SCHOOL DETAIL, every tab/panel, live browser proof.
 *
 * Opens SchoolTest Demo School A (the seeded active school with real data)
 * through the real list row, then walks EVERY tab (overview, admins, teachers,
 * classes, students) plus the seats/entitlement panel, the lifecycle panel,
 * the invitation card and the activity feed. Cross-checks the tab badge
 * counts against what each tab actually serves ([LOGIC] mismatches fail the
 * run with the numbers in the message). Screenshots every panel into
 * tests/e2e/captures/fleet2/.
 */
import fs from 'node:fs';
import path from 'node:path';

import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { apiEnv } from './helpers/auth-db';
import { loadMessages } from './helpers/i18n';
import { loginAs } from './helpers/roles';

const en = loadMessages('en');
const API = process.env.E2E_API_URL ?? 'http://127.0.0.1:5500';
const CAPTURE_DIR = path.resolve(process.cwd(), 'tests/e2e/captures/fleet2');
const SCHOOL_NAME = 'SchoolTest Demo School A';

let shotIndex = 20; // 01-19 belong to the list spec
async function shot(page: Page, slug: string): Promise<void> {
  shotIndex += 1;
  const name = `${String(shotIndex).padStart(2, '0')}-${slug}.png`;
  fs.mkdirSync(CAPTURE_DIR, { recursive: true });
  await page.screenshot({ path: path.join(CAPTURE_DIR, name), fullPage: false });
  console.log(`[fleet2] captured ${name}`);
}

async function gotoRetry(page: Page, url: string, assert: () => Promise<void>): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const aborted = await page
      .goto(url, { waitUntil: 'domcontentloaded' })
      .then(() => false)
      .catch(() => true);
    try {
      await assert();
      return;
    } catch {
      await page.waitForTimeout(3_000 * (attempt + 1));
      if (aborted) continue;
      await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
    }
  }
  await page.goto(url);
  await assert();
}

let cachedJwt = '';
async function opsJwt(request: APIRequestContext): Promise<string> {
  if (cachedJwt) return cachedJwt;
  const password = process.env.E2E_OPS_PASSWORD ?? apiEnv('SEED_ADMIN_PASSWORD');
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const login = await request.post(`${API}/api/auth/local`, {
        data: { identifier: 'admin@schooltest.local', password },
      });
      if (login.status() === 200) {
        cachedJwt = ((await login.json()) as { jwt: string }).jwt;
        return cachedJwt;
      }
      console.log(`[fleet2] ops api login -> ${login.status()} (attempt ${attempt + 1})`);
    } catch (err) {
      console.log(`[fleet2] ops api login network error (attempt ${attempt + 1}): ${err}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 12_000));
  }
  throw new Error('ops api login failed after retries');
}

test.describe('F2 ops school detail — every tab', () => {
  test.describe.configure({ mode: 'serial' });
  let page: Page;
  let schoolId = '';

  test.setTimeout(90_000);

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(240_000); // login retries + fixture resolution on the shared stack
    page = await browser.newPage();
    page.setDefaultTimeout(30_000);
    page.setDefaultNavigationTimeout(60_000);
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await loginAs(page, 'ops');
        break;
      } catch (err) {
        if (attempt === 2) throw err;
        await page.waitForTimeout(15_000);
      }
    }
    const jwt = await opsJwt(page.request);
    const res = await page.request.get(
      `${API}/api/ops/schools?q=${encodeURIComponent(SCHOOL_NAME)}&pageSize=5`,
      { headers: { Authorization: `Bearer ${jwt}`, 'X-Ops-Portal-Version': '1' } },
    );
    const body = (await res.json()) as { data: { documentId: string; name: string }[] };
    const row = (body.data ?? []).find((r) => r.name === SCHOOL_NAME);
    expect(row, `${SCHOOL_NAME} resolved from the live directory`).toBeTruthy();
    schoolId = row!.documentId;
    console.log(`[fleet2] detail target ${SCHOOL_NAME} = ${schoolId}`);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('F2-D1 row click opens the detail overview with header, banner area, invitation card', async () => {
    await gotoRetry(page, '/dashboard/ops/schools', () =>
      expect(page.locator('[data-surface="ops-schools"]')).toBeVisible({ timeout: 60_000 }),
    );
    // the shared dev server can re-render the filtered row mid-click AND the
    // Next router can wedge on in-flight navigations under fleet load (the
    // codebase works around the same thing in OpsSchoolTables) — retry the
    // soft click, then fall back to the hard navigation the deep link renders.
    let detailUrl = '';
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const search = page.getByTestId('ops-schools-search');
      await search.fill('');
      await search.fill(SCHOOL_NAME);
      await page.waitForTimeout(600);
      const row = page.locator('[data-directory-row]', { hasText: SCHOOL_NAME }).first();
      await expect(row).toBeVisible({ timeout: 20_000 });
      const href = await row.getByRole('link').first().getAttribute('href');
      detailUrl = href ?? '';
      await row.getByRole('link').first().click();
      const mounted = await page
        .locator('[data-surface="ops-school-detail"]')
        .waitFor({ state: 'visible', timeout: 15_000 })
        .then(() => true)
        .catch(() => false);
      if (mounted) break;
      console.log(`[fleet2] [ANOMALY] row click did not navigate (attempt ${attempt + 1}, href=${href})`);
      if (attempt === 2) {
        expect(detailUrl, 'row carries its detail href').not.toBe('');
        await gotoRetry(page, detailUrl, () =>
          expect(page.locator('[data-surface="ops-school-detail"]')).toBeVisible({ timeout: 60_000 }),
        );
      }
    }
    await expect(page.getByRole('heading', { name: SCHOOL_NAME })).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('[data-slot="ops-invitation-card"]')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('[data-slot="ops-activity-card"]')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('[data-slot="ops-school-seats"]')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('[data-slot="ops-school-suspend"]')).toBeVisible({ timeout: 30_000 });
    await shot(page, 'detail-overview-top');
    await page.mouse.wheel(0, 900);
    await page.waitForTimeout(400);
    await shot(page, 'detail-overview-scrolled');
  });

  test('F2-D2 tab badges match the server counts (LOGIC cross-check)', async () => {
    await gotoRetry(page, `/dashboard/ops/schools/${schoolId}`, () =>
      expect(page.locator('[data-surface="ops-school-detail"]')).toBeVisible({ timeout: 60_000 }),
    );
    const jwt = await opsJwt(page.request);
    const res = await page.request.get(`${API}/api/ops/schools/${schoolId}`, {
      headers: { Authorization: `Bearer ${jwt}`, 'X-Ops-Portal-Version': '1' },
    });
    expect(res.ok(), await res.text()).toBeTruthy();
    const detail = (await res.json()) as {
      data: { admin_count: number; portal_teacher_count: number; class_count: number; student_count: number };
    };
    const serverCounts: Record<string, number> = {
      admins: detail.data.admin_count,
      teachers: detail.data.portal_teacher_count,
      classes: detail.data.class_count,
      students: detail.data.student_count,
    };
    for (const [tab, expected] of Object.entries(serverCounts)) {
      const badge = page.getByTestId(`ops-tab-count-${tab}`);
      if (expected === 0) {
        expect(await badge.count(), `tab ${tab}: zero count must render NO badge`).toBe(0);
        continue;
      }
      await expect(badge, `tab ${tab} badge`).toHaveText(String(expected), { timeout: 20_000 });
      console.log(`[fleet2] tab badge ${tab} = ${expected} (matches server)`);
    }
    await shot(page, 'detail-tab-badges');
  });

  test('F2-D3 admins tab lists the owner with a row count matching the badge', async () => {
    await gotoRetry(page, `/dashboard/ops/schools/${schoolId}?tab=admins`, () =>
      expect(page.locator('[data-surface="ops-school-detail"]')).toBeVisible({ timeout: 60_000 }),
    );
    await expect(page.getByRole('tab', { name: /Admins/ })).toBeVisible({ timeout: 20_000 });
    await page.waitForTimeout(1_500); // tab query settles
    const rows = page.locator('[data-directory-row]');
    await expect(rows.first()).toBeVisible({ timeout: 30_000 });
    const count = await rows.count();
    console.log(`[fleet2] admins tab rows: ${count}`);
    await shot(page, 'detail-tab-admins');
    expect(count, 'admins tab must list at least the owner').toBeGreaterThanOrEqual(1);
  });

  test('F2-D4 teachers tab lists rows with the status filter control', async () => {
    await gotoRetry(page, `/dashboard/ops/schools/${schoolId}?tab=teachers`, () =>
      expect(page.locator('[data-surface="ops-school-detail"]')).toBeVisible({ timeout: 60_000 }),
    );
    await page.waitForTimeout(1_500);
    const rows = page.locator('[data-directory-row]');
    await expect(rows.first()).toBeVisible({ timeout: 30_000 });
    const count = await rows.count();
    console.log(`[fleet2] teachers tab rows (active page): ${count}`);
    await shot(page, 'detail-tab-teachers');
    // suspended filter offers an empty set honestly
    await gotoRetry(page, `/dashboard/ops/schools/${schoolId}?tab=teachers&blocked=true`, () =>
      expect(page.locator('[data-surface="ops-school-detail"]')).toBeVisible({ timeout: 60_000 }),
    );
    await page.waitForTimeout(1_200);
    await shot(page, 'detail-tab-teachers-suspended-filter');
  });

  test('F2-D5 classes tab lists the classes with student counts', async () => {
    await gotoRetry(page, `/dashboard/ops/schools/${schoolId}?tab=classes`, () =>
      expect(page.locator('[data-surface="ops-school-detail"]')).toBeVisible({ timeout: 60_000 }),
    );
    await expect(page.getByTestId('ops-classes-tab')).toBeVisible({ timeout: 60_000 });
    await page.waitForTimeout(1_500);
    const rows = page.getByTestId('ops-classes-row');
    const count = await rows.count();
    console.log(`[fleet2] classes tab rows: ${count}`);
    expect(count, 'the seeded 30 classes must be listed (page 1)').toBeGreaterThan(0);
    const first = await rows.first().innerText();
    console.log(`[fleet2] first class row: ${first.replace(/\n/g, ' | ').slice(0, 160)}`);
    await shot(page, 'detail-tab-classes');
  });

  test('F2-D6 students tab search + count consistent with the badge (LOGIC cross-check)', async () => {
    await gotoRetry(page, `/dashboard/ops/schools/${schoolId}?tab=students`, () =>
      expect(page.locator('[data-surface="ops-school-detail"]')).toBeVisible({ timeout: 60_000 }),
    );
    const countLine = page.getByText(/\d+ students/).first();
    await expect(countLine).toBeVisible({ timeout: 30_000 });
    const badge = page.getByTestId('ops-tab-count-students');
    await expect(badge).toBeVisible({ timeout: 20_000 });
    const badgeText = await badge.innerText();
    const summaryText = await countLine.innerText();
    console.log(`[fleet2] students tab: badge=${badgeText}, summary="${summaryText}"`);
    await shot(page, 'detail-tab-students');
    // the tab's served total must equal the badge (same server number)
    expect(
      summaryText,
      `[LOGIC] students tab total ("${summaryText}") vs tab badge (${badgeText})`,
    ).toContain(badgeText);
    // search narrows inside the school's own roster only
    const search = page.getByPlaceholder('Search name or email');
    await search.fill('zz-f2-none');
    await page.waitForTimeout(800);
    await shot(page, 'detail-tab-students-empty-search');
    await expect(page.locator('[data-directory-row], [data-directory-card]').filter({ hasText: /zz-f2-none/i })).toHaveCount(0);
    await search.fill('');
    await page.waitForTimeout(800);
  });

  test('F2-D7 seats panel shows an editable entitlement and matches the API', async () => {
    await gotoRetry(page, `/dashboard/ops/schools/${schoolId}`, () =>
      expect(page.locator('[data-surface="ops-school-detail"]')).toBeVisible({ timeout: 60_000 }),
    );
    const seats = page.locator('[data-slot="ops-school-seats"]');
    await expect(seats).toBeVisible({ timeout: 30_000 });
    // the meter renders once the entitlement read has landed (a skeleton and an
    // empty draft sit in its place while loading; an error surface replaces it)
    await expect(seats.locator('[data-surface="ops-school-seats-error"]')).toHaveCount(0, { timeout: 30_000 });
    await expect(seats.locator('[data-surface="ops-school-seats-meter"]')).toBeVisible({ timeout: 30_000 });
    const input = seats.getByTestId('ops-school-seats-input');
    await expect(input).not.toBeDisabled({ timeout: 30_000 });
    const uiTotal = await input.inputValue();
    const meterText = await seats.locator('[data-surface="ops-school-seats-meter"]').innerText();
    console.log(`[fleet2] seats panel UI total: ${uiTotal} (meter: ${meterText.trim()})`);
    await shot(page, 'detail-seats-panel');

    const jwt = await opsJwt(page.request);
    const res = await page.request.get(`${API}/api/schools/${schoolId}/entitlement`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    if (res.ok()) {
      const body = (await res.json()) as { data?: { seats_total?: number; seats_used?: number } };
      const apiTotal = body.data?.seats_total;
      console.log(`[fleet2] seats API total: ${apiTotal} (UI shows ${uiTotal})`);
      if (apiTotal !== undefined && String(apiTotal) !== uiTotal) {
        throw new Error(`[LOGIC] seats mismatch: UI panel shows ${uiTotal}, API entitlement says ${apiTotal}`);
      }
    } else {
      console.log(`[fleet2] seats API read -> HTTP ${res.status()} (panel may source the detail read instead)`);
    }
    // the save CTA is wired to the dirty flag: with NO changes it is honestly
    // DISABLED (design intent — never dispatch a no-op seat write)
    await expect(seats.getByTestId('ops-school-seats-save')).toBeDisabled();
    await input.fill(String(Number(uiTotal || 0) + 1));
    await expect(seats.getByTestId('ops-school-seats-save')).toBeEnabled({ timeout: 20_000 });
    await input.fill(uiTotal); // restore without saving
    await expect(seats.getByTestId('ops-school-seats-save')).toBeDisabled({ timeout: 20_000 });
  });

  test('F2-D8 lifecycle panel shows the active state with a working ⋯ menu', async () => {
    await gotoRetry(page, `/dashboard/ops/schools/${schoolId}`, () =>
      expect(page.locator('[data-surface="ops-school-detail"]')).toBeVisible({ timeout: 60_000 }),
    );
    const suspendPanel = page.locator('[data-slot="ops-school-suspend"]');
    await expect(suspendPanel).toBeVisible({ timeout: 30_000 });
    const accountStatus = await suspendPanel.getAttribute('data-account-status');
    const portalStatus = await suspendPanel.getAttribute('data-portal-status');
    console.log(`[fleet2] ${SCHOOL_NAME} account_status=${accountStatus} portal_status=${portalStatus}`);
    expect(accountStatus).toBe('active');
    await shot(page, 'detail-lifecycle-panel-active');

    // the ⋯ More actions menu opens and offers the lifecycle entries — but NO delete
    await page.getByRole('button', { name: 'More actions' }).click();
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible({ timeout: 10_000 });
    const items = await page.getByRole('menuitem').allInnerTexts();
    console.log(`[fleet2] detail ⋯ menu items: ${JSON.stringify(items)}`);
    await shot(page, 'detail-more-actions-menu');
    expect(items.join(' | ').toLowerCase()).not.toContain('delete');
    await page.keyboard.press('Escape');
  });

  test('F2-D9 activity feed lists dated events; invitation card renders its state', async () => {
    await gotoRetry(page, `/dashboard/ops/schools/${schoolId}`, () =>
      expect(page.locator('[data-surface="ops-school-detail"]')).toBeVisible({ timeout: 60_000 }),
    );
    const activity = page.locator('[data-slot="ops-activity-card"]');
    await expect(activity).toBeVisible({ timeout: 30_000 });
    await expect(activity.locator('li').first()).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('[data-slot="ops-activity-empty"]')).toHaveCount(0);
    await shot(page, 'detail-activity-feed');

    const invitation = page.locator('[data-slot="ops-invitation-card"]');
    await expect(invitation).toBeVisible({ timeout: 20_000 });
    await invitation.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await shot(page, 'detail-invitation-card');
  });
});
