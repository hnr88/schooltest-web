/**
 * OPS-011 — the Schools screen driven against the versioned directory.
 *
 * The ops session is the REAL signed-in portal (auth-fixture task-005); the
 * fixture schools are created and deleted through the REAL contracts. The
 * screen under test is the server-driven C-OPS-PORTAL-001 table: URL params
 * are the source of truth for q/state/sector/sort/page, the API applies them,
 * and the totals on screen come from meta.pagination — never from counting
 * loaded rows.
 */
import { randomUUID } from 'node:crypto';

import { expect, type APIRequestContext, type Page, type TestInfo } from '@playwright/test';

import { apiEnv } from '../helpers/auth-db';
import { test } from '../helpers/auth-fixture';

const API = process.env.E2E_API_URL ?? 'http://127.0.0.1:5500';
const SCREEN = '/en/dashboard/ops/schools';
const CAPTURES = '/home/hnr/Code/schooltest/mvp/ops/proof/shots';

let jwt = '';
const token = `ops011w${Date.now().toString(36)}`;
const created: string[] = [];

async function opsApi(request: APIRequestContext): Promise<void> {
  const login = await request.post(`${API}/api/auth/local`, {
    data: { identifier: 'apiadmin@schooltest.local', password: apiEnv('SEED_APIADMIN_PASSWORD') },
  });
  expect(login.ok()).toBeTruthy();
  jwt = ((await login.json()) as { jwt: string }).jwt;
}

async function createFixture(request: APIRequestContext, name: string, state: string): Promise<string> {
  const res = await request.post(`${API}/api/schools`, {
    headers: { Authorization: `Bearer ${jwt}`, 'X-Ops-Portal-Version': '1', 'Idempotency-Key': randomUUID() },
    data: {
      name,
      contact_email: `${token}@fixture.schooltest.local`,
      contact_name: `${name} Contact`,
      suburb: 'Probeville',
      state,
      sector: 'government',
      portal: { plan: 'standard', status: 'active', send_owner_invitation: false },
    },
  });
  expect([200, 201]).toContain(res.status());
  const body = (await res.json()) as { data: { documentId: string } };
  created.push(body.data.documentId);
  return body.data.documentId;
}

test.beforeAll(async ({ request }) => {
  await opsApi(request);
  await createFixture(request, `${token} Tas Gov`, 'TAS');
  await createFixture(request, `${token} Vic Cath`, 'VIC');
});

test.afterAll(async ({ request }) => {
  for (const documentId of created.reverse()) {
    await request.delete(`${API}/api/ops/schools/${documentId}`, {
      headers: { Authorization: `Bearer ${jwt}`, 'X-Ops-Portal-Version': '1' },
    });
  }
});

test('the directory renders server-driven rows, the gap pills and the pager', async ({ authPage: page }) => {
  await page.goto(SCREEN);
  await expect(page.locator('[data-slot="ops-schools"]')).toBeVisible();

  const pills = page.locator('[data-slot="ops-schools-pills"]');
  await expect(pills).toBeVisible();
  // GAP-12/16 recorded on screen: five pictured status pills, non-functional.
  await expect(page.locator('[data-slot="ops-schools-pills"] [data-gap]')).toHaveCount(5);

  const pager = page.locator('[data-slot="ops-schools-pagination"]');
  await expect(pager).toBeVisible();
  await expect(pager.getByRole('button', { name: /previous/i })).toBeDisabled();

  await expect(page.getByRole('status').first()).toContainText(/of \d+ schools/);
});

test('search round-trips through the URL and matches the fixture school', async ({ authPage: page }) => {
  await page.goto(SCREEN);
  await page.getByLabel(/search schools/i).fill(token);
  await expect(page).toHaveURL(new RegExp(`q=${token}`));
  await expect(page.locator('tbody tr')).toHaveCount(2);
  await expect(page.getByRole('link', { name: `${token} Tas Gov` })).toBeVisible();
  await expect(page.getByRole('link', { name: `${token} Vic Cath` })).toBeVisible();

  await page.getByRole('button', { name: /clear all/i }).click();
  await expect(page).not.toHaveURL(/q=/);
});

test('state and sort params drive the server query and survive reload', async ({ authPage: page }) => {
  await page.goto(`${SCREEN}?state=TAS&q=${token}&sort=last_active_at:desc`);
  await expect(page.locator('[data-slot="ops-schools"]')).toBeVisible();
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await expect(page.getByRole('link', { name: `${token} Tas Gov` })).toBeVisible();
  await expect(page.getByRole('link', { name: `${token} Vic Cath` })).toHaveCount(0);

  await page.reload();
  await expect(page).toHaveURL(/state=TAS/);
  await expect(page.locator('tbody tr')).toHaveCount(1);
});

test('crest fallback, count scope, recent sort, and header create are real', async ({ authPage: page }, testInfo: TestInfo) => {
  const failedRequests: string[] = [];
  page.on('requestfailed', (request) => {
    if (request.url().includes('/uploads/')) failedRequests.push(request.url());
  });
  await page.goto(`${SCREEN}?q=${token}`);
  await expect(page.locator('tbody tr')).toHaveCount(2);
  await expect(page.getByRole('status').filter({ hasText: /Showing 2 of 2 schools/ })).toBeVisible();
  await expect(page.locator('[data-slot="media-cover"][data-empty]')).toHaveCount(2);
  await expect(page.locator('tbody')).toContainText('Never');
  await expect(page.getByRole('button', { name: /create school/i })).toBeVisible();
  await page.getByRole('button', { name: /create school/i }).click();
  await expect(page.locator('[data-slot="ops-create-school-dialog"]')).toBeVisible();
  await page.getByRole('button', { name: /cancel/i }).click();
  expect(failedRequests).toEqual([]);
  await page.setViewportSize({ width: 1440, height: 900 });
  const crest = await page.screenshot({ path: `${CAPTURES}/07-crest-fallback.png`, fullPage: false });
  await testInfo.attach('07-crest-fallback.png', { body: crest, contentType: 'image/png' });

  const sort = page.getByLabel(/sort/i);
  await sort.click();
  await page.getByRole('option', { name: /recently active/i }).click();
  await expect(page).toHaveURL(/sort=last_active_at%3Adesc|sort=last_active_at:desc/);
  await page.reload();
  await expect(page).toHaveURL(/sort=last_active_at%3Adesc|sort=last_active_at:desc/);
});

test('search no-match empty state offers a clear-search action', async ({ authPage: page }, testInfo: TestInfo) => {
  await page.goto(`${SCREEN}?q=${token}-no-match`);
  await expect(page.getByRole('heading', { name: /no schools match your search/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /clear search/i })).toBeVisible();
  const shot = await page.screenshot({ path: `${CAPTURES}/07-empty-no-search-match.png`, fullPage: false });
  await testInfo.attach('07-empty-no-search-match.png', { body: shot, contentType: 'image/png' });
});

test('filter no-match empty state offers a clear-filters action', async ({ authPage: page }, testInfo: TestInfo) => {
  await page.goto(`${SCREEN}?state=ACT&sector=catholic&plan=enterprise&onboarding=complete`);
  await expect(page.getByRole('heading', { name: /no schools match these filters/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /clear filters/i })).toBeVisible();
  const shot = await page.screenshot({ path: `${CAPTURES}/07-empty-no-filter-match.png`, fullPage: false });
  await testInfo.attach('07-empty-no-filter-match.png', { body: shot, contentType: 'image/png' });
});

test('visual captures: reference desktop and 375px, identical data, real rows', async ({ authPage: page }, testInfo: TestInfo) => {
  await page.goto(`${SCREEN}?q=${token}`);
  await expect(page.locator('tbody tr')).toHaveCount(2);

  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator('[data-slot="ops-schools"]')).toBeVisible();
  const desktop = await page.screenshot({ path: `${CAPTURES}/07-schools-list.png`, fullPage: false });
  await testInfo.attach('07-schools-list.png', { body: desktop, contentType: 'image/png' });

  await page.setViewportSize({ width: 375, height: 800 });
  await expect(page.locator('[data-slot="ops-schools"]')).toBeVisible();
  const mobile = await page.screenshot({ path: `${CAPTURES}/07-schools-list-mobile.png`, fullPage: false });
  await testInfo.attach('07-schools-list-mobile.png', { body: mobile, contentType: 'image/png' });
});

/**
 * ops/08 — the row action menu, the typed-name archive and the Undo toast.
 *
 * One dedicated fixture school rides the WHOLE design lifecycle ON THE LIST:
 * every confirm is the real dialog, every write is the real versioned endpoint,
 * and the row only moves when the refetched list says so. The fixture is active
 * again after each test, so the tests are order-independent; the file's
 * afterAll deletes it like the other fixtures.
 */
test.describe('08 — row actions, typed archive, undo', () => {
  const LIFECYCLE = `${token} Lifecycle`;
  /** The lifecycle write endpoints C-OPS-PORTAL-005/005a/016/017/018. */
  const WRITE_URL = /\/api\/ops\/schools\/[^/]+\/(suspend|activate|archive|restore|lifecycle-actions)/;
  const VIEWPORT = { width: 1440, height: 900 };

  /** The API restarts under peer edits; poll readiness instead of trusting one probe. */
  async function whenApiReady(action: () => Promise<void>): Promise<void> {
    let last: unknown;
    for (let attempt = 0; attempt < 10; attempt += 1) {
      try {
        const ready = await fetch(`${API}/api/readiness`);
        if (ready.ok) {
          await action();
          return;
        }
      } catch (error) {
        last = error;
      }
      await new Promise((resolve) => setTimeout(resolve, 8_000));
    }
    throw last ?? new Error('[ops-08] API never became ready');
  }

  /** The exact name, the dialog, the CTA — everything a lifecycle ride needs. */
  async function openRowMenu(page: Page, name: string) {
    const row = page.locator('tbody tr', { hasText: name });
    await expect(row).toBeVisible();
    await row.getByRole('button', { name: 'Row actions' }).click();
    return row;
  }

  async function confirmDialog(page: Page, title: string | RegExp) {
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    await expect(dialog.getByText(title)).toBeVisible();
    return dialog;
  }

  test.beforeAll(async ({ request }) => {
    await whenApiReady(async () => {
      await createFixture(request, LIFECYCLE, 'NSW');
    });
  });

  test('an active row shows the design menu, and suspend/reactivate ride the list', async ({ authPage: page }, testInfo: TestInfo) => {
    test.setTimeout(180_000);
    await page.setViewportSize(VIEWPORT);
    const writes: string[] = [];
    page.on('request', (request) => {
      if (WRITE_URL.test(request.url())) writes.push(request.url());
    });

    // The design's menu for ACTIVE (`:1258-1266`): Open school, then the kept
    // Status page, Edit details, Invite admin, the ONE conditional entry
    // (Suspend school), Archive school. Nothing filtered out.
    await page.goto(`${SCREEN}?q=${encodeURIComponent(LIFECYCLE)}`);
    await openRowMenu(page, LIFECYCLE);
    await expect(page.getByRole('menuitem', { name: 'Open school' })).toBeVisible();
    for (const label of ['Open school', 'Status page', 'Edit details', 'Invite admin', 'Suspend school', 'Archive school']) {
      await expect(page.getByRole('menuitem', { name: label, exact: true })).toHaveCount(1);
    }
    await page.screenshot({ path: `${CAPTURES}/08-row-menu-active.png` });
    await testInfo.attach('08-row-menu-active.png', { path: `${CAPTURES}/08-row-menu-active.png` });
    await page.keyboard.press('Escape');

    // Suspend school: its confirm names the effect with the design's words.
    await openRowMenu(page, LIFECYCLE);
    await page.getByRole('menuitem', { name: 'Suspend school' }).click();
    const suspendDialog = await confirmDialog(page, 'Suspend ' + LIFECYCLE + '?');
    await expect(suspendDialog.getByText('Staff and students lose access until reactivated. Test windows in progress are paused.')).toBeVisible();
    await suspendDialog.getByRole('button', { name: 'Suspend school' }).click();
    await expect(suspendDialog).toBeHidden({ timeout: 20_000 });
    await expect(page.locator('tbody tr', { hasText: LIFECYCLE }).getByText('Suspended', { exact: true })).toBeVisible({ timeout: 20_000 });

    // SUSPENDED: the single conditional entry swaps to Reactivate school.
    await openRowMenu(page, LIFECYCLE);
    await expect(page.getByRole('menuitem', { name: 'Suspend school' })).toHaveCount(0);
    await expect(page.getByRole('menuitem', { name: 'Reactivate school', exact: true })).toHaveCount(1);
    await page.screenshot({ path: `${CAPTURES}/08-row-menu-suspended.png` });
    await testInfo.attach('08-row-menu-suspended.png', { path: `${CAPTURES}/08-row-menu-suspended.png` });
    await page.getByRole('menuitem', { name: 'Reactivate school' }).click();
    const reactivateDialog = await confirmDialog(page, 'Reactivate ' + LIFECYCLE + '?');
    await expect(reactivateDialog.getByText('Staff and students regain access immediately and scheduled test windows resume.')).toBeVisible();
    await reactivateDialog.getByRole('button', { name: 'Reactivate' }).click();
    await expect(reactivateDialog).toBeHidden({ timeout: 20_000 });
    await expect(page.locator('tbody tr', { hasText: LIFECYCLE }).getByText('Active', { exact: true })).toBeVisible({ timeout: 20_000 });

    // Open school keeps working with the locale-prefixed navigation.
    await openRowMenu(page, LIFECYCLE);
    await page.getByRole('menuitem', { name: 'Open school' }).click();
    await expect(page).toHaveURL(/\/en\/dashboard\/ops\/schools\/[A-Za-z0-9]+/, { timeout: 20_000 });

    expect(writes.filter((url) => url.endsWith('/suspend'))).toHaveLength(1);
    expect(writes.filter((url) => url.endsWith('/activate'))).toHaveLength(1);
  });

  test('archive is typed-name gated; a mismatch sends nothing; Undo restores the row', async ({ authPage: page }, testInfo: TestInfo) => {
    test.setTimeout(180_000);
    await page.setViewportSize(VIEWPORT);
    const archivePosts: string[] = [];
    page.on('request', (request) => {
      if (/\/api\/ops\/schools\/[^/]+\/archive/.test(request.url()) && request.method() === 'POST') {
        archivePosts.push(request.url());
      }
    });

    await page.goto(`${SCREEN}?q=${encodeURIComponent(LIFECYCLE)}`);
    await openRowMenu(page, LIFECYCLE);
    await page.getByRole('menuitem', { name: 'Archive school' }).click();
    const dialog = await confirmDialog(page, 'Archive ' + LIFECYCLE + '?');
    // The design's contractual body, verbatim (`:1264`).
    await expect(dialog.getByText('The school is hidden from the active list and billing stops. Data is retained for 24 months.')).toBeVisible();
    const input = dialog.getByRole('textbox');
    await expect(input).toBeVisible();

    // A mismatched name: the CTA stays clickable at reduced opacity, the
    // design's message flashes, and NO request is sent (`:1638`/`:1649`).
    await input.fill('Some Other School');
    const before = archivePosts.length;
    await dialog.getByRole('button', { name: 'Archive school' }).click();
    await expect(dialog.getByRole('alert')).toContainText('Type the name exactly as shown to confirm.');
    await expect(dialog).toBeVisible();
    expect(archivePosts.length).toBe(before);

    // The exact name unlocks the CTA and archives for real.
    await input.fill(LIFECYCLE);
    await expect(dialog.getByRole('alert')).toHaveCount(0);
    await page.screenshot({ path: `${CAPTURES}/08-confirm-archive-typed.png` });
    await testInfo.attach('08-confirm-archive-typed.png', { path: `${CAPTURES}/08-confirm-archive-typed.png` });
    await dialog.getByRole('button', { name: 'Archive school' }).click();
    await expect(dialog).toBeHidden({ timeout: 20_000 });

    // The success toast carries the design's line and the Undo action.
    const toast = page.locator('[data-sonner-toast]', { hasText: `${LIFECYCLE} archived` });
    await expect(toast).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: `${CAPTURES}/08-toast-undo.png` });
    await testInfo.attach('08-toast-undo.png', { path: `${CAPTURES}/08-toast-undo.png` });
    await expect(page.locator('tbody tr', { hasText: LIFECYCLE }).getByText('Archived', { exact: true })).toBeVisible({ timeout: 20_000 });

    // Undo calls C-OPS-PORTAL-018 with the returned handle; the row is Active again.
    const undoCalls: string[] = [];
    page.on('request', (request) => {
      if (/\/lifecycle-actions\/[^/]+\/undo/.test(request.url())) undoCalls.push(request.url());
    });
    await toast.getByRole('button', { name: 'Undo' }).click();
    await expect(page.locator('[data-sonner-toast]', { hasText: 'Change reverted' })).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('tbody tr', { hasText: LIFECYCLE }).getByText('Active', { exact: true })).toBeVisible({ timeout: 20_000 });
    expect(undoCalls).toHaveLength(1);
    expect(archivePosts).toHaveLength(1);
  });

  test('an archived row restores to Pending setup and then activates, all from the menu', async ({ authPage: page }) => {
    test.setTimeout(240_000);
    await page.setViewportSize(VIEWPORT);

    await page.goto(`${SCREEN}?q=${encodeURIComponent(LIFECYCLE)}`);
    // Archive (typed) — no Undo click this time; the window simply runs out.
    await openRowMenu(page, LIFECYCLE);
    await page.getByRole('menuitem', { name: 'Archive school' }).click();
    const archiveDialog = await confirmDialog(page, 'Archive ' + LIFECYCLE + '?');
    await archiveDialog.getByRole('textbox').fill(LIFECYCLE);
    await archiveDialog.getByRole('button', { name: 'Archive school' }).click();
    await expect(archiveDialog).toBeHidden({ timeout: 20_000 });
    await expect(page.locator('tbody tr', { hasText: LIFECYCLE }).getByText('Archived', { exact: true })).toBeVisible({ timeout: 20_000 });

    // ARCHIVED: exactly one conditional entry — Restore school, no Archive.
    await openRowMenu(page, LIFECYCLE);
    await expect(page.getByRole('menuitem', { name: 'Archive school' })).toHaveCount(0);
    await expect(page.getByRole('menuitem', { name: 'Restore school', exact: true })).toHaveCount(1);
    await page.getByRole('menuitem', { name: 'Restore school' }).click();
    const restoreDialog = await confirmDialog(page, 'Restore ' + LIFECYCLE + '?');
    await expect(restoreDialog.getByText('The school returns to Pending setup. No data is deleted while archived.')).toBeVisible();
    await restoreDialog.getByRole('button', { name: 'Restore' }).click();
    await expect(restoreDialog).toBeHidden({ timeout: 20_000 });
    // Restore lands on Pending setup (sm-school), never straight to Active.
    await expect(page.locator('tbody tr', { hasText: LIFECYCLE }).getByText('Pending setup', { exact: true })).toBeVisible({ timeout: 20_000 });

    // PENDING_SETUP: the conditional entry is Activate school.
    await openRowMenu(page, LIFECYCLE);
    await expect(page.getByRole('menuitem', { name: 'Activate school', exact: true })).toHaveCount(1);
    await page.getByRole('menuitem', { name: 'Activate school' }).click();
    const activateDialog = await confirmDialog(page, 'Activate ' + LIFECYCLE + '?');
    await expect(activateDialog.getByText('Billing starts on the current plan and all invited staff get access.')).toBeVisible();
    await activateDialog.getByRole('button', { name: 'Activate' }).click();
    await expect(activateDialog).toBeHidden({ timeout: 20_000 });
    await expect(page.locator('tbody tr', { hasText: LIFECYCLE }).getByText('Active', { exact: true })).toBeVisible({ timeout: 20_000 });
  });

  test('offline, a lifecycle entry refuses with Retry and sends nothing', async ({ authPage: page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize(VIEWPORT);
    const writes: string[] = [];
    page.on('request', (request) => {
      if (WRITE_URL.test(request.url())) writes.push(request.url());
    });

    await page.goto(`${SCREEN}?q=${encodeURIComponent(LIFECYCLE)}`);
    await expect(page.locator('tbody tr', { hasText: LIFECYCLE })).toBeVisible();

    await page.context().setOffline(true);
    try {
      await openRowMenu(page, LIFECYCLE);
      await page.getByRole('menuitem', { name: 'Suspend school' }).click();
      const toast = page.locator('[data-sonner-toast]', { hasText: 'You’re offline — nothing was saved' });
      await expect(toast).toBeVisible({ timeout: 10_000 });
      await expect(toast.getByRole('button', { name: 'Retry' })).toBeVisible();
      expect(writes).toEqual([]);

      // Back online, the toast's Retry re-runs the CHOICE — the confirm opens;
      // it never dispatches the write past its own dialog.
      await page.context().setOffline(false);
      await toast.getByRole('button', { name: 'Retry' }).click();
      const dialog = await confirmDialog(page, 'Suspend ' + LIFECYCLE + '?');
      await dialog.getByRole('button', { name: 'Cancel' }).click();
      await expect(dialog).toBeHidden({ timeout: 10_000 });
    } finally {
      await page.context().setOffline(false);
    }
    expect(writes).toEqual([]);
  });

  test('a read-only (ops_support) session: write entries present, refusal toast, zero requests', async ({ authPage: page }, testInfo: TestInfo) => {
    test.setTimeout(120_000);
    await page.setViewportSize(VIEWPORT);

    // A contract-valid ops_support capabilities body (write: false — the same
    // body the contract derives for that role), served from the real endpoint
    // URL; the portal asks the server, never the role string.
    const updatedAt = new Date().toISOString();
    await page.route('**/api/ops/capabilities*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            actor: {
              documentId: 'zz08readonlysessionactor1',
              first_name: 'Support',
              last_name: 'Session',
              email: 'support@schooltest.local',
              role: 'ops_support',
              updatedAt,
            },
            capabilities: { read: true, write: false, export: true, view_as_teacher: false, edit_self: true },
            status_page_url: null,
          },
          meta: {},
        }),
      }),
    );
    const writes: string[] = [];
    page.on('request', (request) => {
      if (WRITE_URL.test(request.url())) writes.push(request.url());
    });

    await page.goto(`${SCREEN}?q=${encodeURIComponent(LIFECYCLE)}`);
    await expect(page.locator('tbody tr', { hasText: LIFECYCLE })).toBeVisible();

    // The write entries stay IN the menu — a locked entry is greyed, never hidden.
    await openRowMenu(page, LIFECYCLE);
    for (const label of ['Edit details', 'Invite admin', 'Suspend school', 'Archive school']) {
      await expect(page.getByRole('menuitem', { name: label, exact: true })).toBeVisible();
    }
    await page.screenshot({ path: `${CAPTURES}/08-row-menu-readonly.png` });
    await testInfo.attach('08-row-menu-readonly.png', { path: `${CAPTURES}/08-row-menu-readonly.png` });

    // Clicking one refuses with the design's message and reaches NO endpoint.
    await page.getByRole('menuitem', { name: 'Suspend school' }).click();
    await expect(
      page.locator('[data-sonner-toast]', {
        hasText: 'Support accounts are read-only — ask an ops admin to make this change',
      }),
    ).toBeVisible({ timeout: 10_000 });
    expect(writes).toEqual([]);
  });
});
