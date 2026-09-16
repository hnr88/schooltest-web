/**
 * FLEET2 scratch — ops schools EXTRAS, live browser proof.
 *
 * Robustness battery around the schools surfaces:
 *  - a bogus school documentId in the URL renders the clean not-found state;
 *  - double-clicking the destructive suspend CTA must issue exactly ONE write;
 *  - refreshing mid-dialog must not corrupt the page or auto-confirm;
 *  - browser-back after an out-of-band delete must not resurrect a stale row;
 *  - a school_admin account is bounced off /dashboard/ops (cross-check).
 * Every step screenshots into tests/e2e/captures/fleet2/.
 */
import fs from 'node:fs';
import path from 'node:path';

import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { apiEnv } from './helpers/auth-db';
import { cat, loadMessages } from './helpers/i18n';
import { loginAs } from './helpers/roles';

const en = loadMessages('en');
const API = process.env.E2E_API_URL ?? 'http://127.0.0.1:5500';
const CAPTURE_DIR = path.resolve(process.cwd(), 'tests/e2e/captures/fleet2');
const EPOCH = Date.now();

let shotIndex = 70; // 01-19 list, 20-39 detail, 40-69 lifecycle
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
  const login = await request.post(`${API}/api/auth/local`, {
    data: { identifier: 'admin@schooltest.local', password: process.env.E2E_OPS_PASSWORD ?? apiEnv('SEED_ADMIN_PASSWORD') },
  });
  expect(login.status(), 'ops api login').toBe(200);
  cachedJwt = ((await login.json()) as { jwt: string }).jwt;
  return cachedJwt;
}

/** Create an EMPTY active fixture school directly through the versioned API. */
async function createEmptySchool(request: APIRequestContext): Promise<{ id: string; name: string }> {
  const jwt = await opsJwt(request);
  const name = `F2-extras-${EPOCH}-${Math.random().toString(36).slice(2, 7)}`;
  const res = await request.post(`${API}/api/schools`, {
    headers: { Authorization: `Bearer ${jwt}`, 'Idempotency-Key': `f2-extras-${EPOCH}` },
    data: {
      name,
      suburb: 'Fleetville',
      state: 'VIC',
      sector: 'government',
      contact_name: 'F2 Extras Owner',
      contact_email: `f2-extras-${EPOCH}@schooltest.local`,
      portal: { plan: 'standard', status: 'active', send_owner_invitation: false },
    },
  });
  expect(res.status(), await res.text()).toBe(201);
  const id = ((await res.json()) as { data: { documentId: string } }).data.documentId;
  return { id, name };
}

/**
 * Portal-active requires terminal onboarding (the precedence the detail header
 * renders) — walk the real link → complete wizard over the API so the
 * fixture's primary action is Suspend.
 */
async function onboardSchool(request: APIRequestContext, documentId: string): Promise<void> {
  const jwt = await opsJwt(request);
  const link = await request.post(`${API}/api/schools/${documentId}/onboarding-link`, {
    headers: { Authorization: `Bearer ${jwt}`, 'X-Ops-Portal-Version': '1' },
    data: {
      first_name: 'F2',
      last_name: 'Extras Owner',
      contact_email: `f2-extras-owner-${EPOCH}@schooltest.local`,
    },
  });
  expect(link.status(), await link.text()).toBe(201);
  const token = String(((await link.json()) as { data?: { token?: string } }).data?.token ?? '');
  expect(token, 'onboarding token minted').not.toBe('');
  const complete = await request.post(`${API}/api/school-onboarding/${token}/complete`, {
    data: {
      payload: { steps: { details: true } },
      admin: {
        first_name: 'F2',
        last_name: 'Extras Owner',
        email: `f2-extras-owner-${EPOCH}@schooltest.local`,
        password: 'F2Extras123!setup',
      },
      teachers: [],
    },
  });
  expect(complete.status(), await complete.text()).toBe(200);
}


/** Delete the fixture's onboarded owner account (if any), then the school. */
async function deleteFixtureSchool(request: APIRequestContext, documentId: string): Promise<number> {
  const jwt = await opsJwt(request);
  const ownerEmail = `f2-extras-owner-${EPOCH}@schooltest.local`;
  const found = await request.get(
    `${API}/api/ops/users?q=${encodeURIComponent(ownerEmail)}&pageSize=10`,
    { headers: { Authorization: `Bearer ${jwt}`, 'X-Ops-Portal-Version': '1' } },
  );
  if (found.ok()) {
    const rows = ((await found.json()) as { data?: { documentId: string; email?: string }[] }).data ?? [];
    for (const row of rows) {
      if (row.email !== ownerEmail) continue;
      const del = await request.delete(`${API}/api/ops/users/${row.documentId}`, {
        headers: { Authorization: `Bearer ${jwt}`, 'X-Ops-Portal-Version': '1' },
      });
      console.log(`[fleet2] cleanup owner account ${row.documentId} -> ${del.status()}`);
    }
  }
  const del = await request.delete(`${API}/api/ops/schools/${documentId}`, {
    headers: { Authorization: `Bearer ${jwt}`, 'X-Ops-Portal-Version': '1' },
  });
  return del.status();
}

test.describe('F2 ops schools extras', () => {
  test.describe.configure({ mode: 'serial' });
  let page: Page;

  test.setTimeout(90_000);

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    page.setDefaultTimeout(30_000);
    page.setDefaultNavigationTimeout(60_000);
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await loginAs(page, 'ops');
        return;
      } catch (err) {
        if (attempt === 2) throw err;
        await page.waitForTimeout(15_000);
      }
    }
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('F2-X1 bogus school documentId renders the clean not-found state', async () => {
    // NOTE: the not-found branch renders a bare <main> WITHOUT the
    // data-surface="ops-school-detail" attribute — assert the copy, not the slot.
    await gotoRetry(page, '/dashboard/ops/schools/zzzz-bogus-f2-document-id', () =>
      expect(page.getByText(cat(en, 'Ops.detail.notFoundTitle'))).toBeVisible({ timeout: 60_000 }),
    );
    await expect(page.getByText(cat(en, 'Ops.detail.notFoundDescription'))).toBeVisible();
    const body = (await page.locator('body').innerText()).slice(0, 400);
    expect(body.toLowerCase()).not.toContain('application error');
    expect(body.toLowerCase()).not.toContain('unhandled');
    await shot(page, 'extras-bogus-id-not-found');
    // a second flavour: valid-shaped but nonexistent id
    await gotoRetry(page, '/dashboard/ops/schools/aaaaaaaaaaaaaaaaaaaaaa', () =>
      expect(page.getByText(cat(en, 'Ops.detail.notFoundTitle'))).toBeVisible({ timeout: 60_000 }),
    );
    await shot(page, 'extras-bogus-id-not-found-second');
  });

  test('F2-X2 double-clicking the suspend confirm CTA issues exactly ONE write', async () => {
    const fixture = await createEmptySchool(page.request);
    await onboardSchool(page.request, fixture.id);
    console.log(`[fleet2] double-click fixture ${fixture.name} = ${fixture.id}`);
    try {
      await gotoRetry(page, `/dashboard/ops/schools/${fixture.id}`, () =>
        expect(page.locator('[data-surface="ops-school-detail"]')).toBeVisible({ timeout: 60_000 }),
      );
      await page.locator('[data-action="primary-suspend"]').click();
      const confirmTitle = cat(en, 'Ops.detail.actions.confirm.suspend.title').replace('{name}', fixture.name);
      await expect(page.getByText(confirmTitle)).toBeVisible({ timeout: 20_000 });
      await shot(page, 'extras-doubleclick-confirm-open');

      const suspendResponses: number[] = [];
      page.on('response', (res) => {
        if (res.url().includes('/suspend') && res.request().method() === 'POST') {
          suspendResponses.push(res.status());
        }
      });
      const cta = page.getByRole('button', { name: cat(en, 'Ops.detail.actions.confirm.suspend.cta') });
      await cta.click();
      await cta.click({ timeout: 2_000 }).catch(() => {
        /* the dialog may already have closed — also fine, proves single dispatch */
      });
      await expect(page.getByText(cat(en, 'Ops.detail.banner.suspended.title'))).toBeVisible({ timeout: 30_000 });
      await page.waitForTimeout(2_000); // let a duplicate request surface if one is coming
      await shot(page, 'extras-doubleclick-suspended');
      console.log(`[fleet2] suspend responses after double-click: ${JSON.stringify(suspendResponses)}`);
      const ok = suspendResponses.filter((status) => status < 300);
      expect(ok.length, `double-click must produce exactly one suspend write, saw ${JSON.stringify(suspendResponses)}`).toBe(1);
    } finally {
      await deleteFixtureSchool(page.request, fixture.id).catch(() => {});
    }
  });

  test('F2-X3 refresh mid-confirm-dialog: dialog closes, page renders, nothing auto-confirms', async () => {
    const fixture = await createEmptySchool(page.request);
    await onboardSchool(page.request, fixture.id);
    console.log(`[fleet2] refresh fixture ${fixture.name} = ${fixture.id}`);
    try {
      await gotoRetry(page, `/dashboard/ops/schools/${fixture.id}`, () =>
        expect(page.locator('[data-surface="ops-school-detail"]')).toBeVisible({ timeout: 60_000 }),
      );
      await page.locator('[data-action="primary-suspend"]').click();
      const confirmTitle = cat(en, 'Ops.detail.actions.confirm.suspend.title').replace('{name}', fixture.name);
      await expect(page.getByText(confirmTitle)).toBeVisible({ timeout: 20_000 });
      await shot(page, 'extras-refresh-mid-dialog');
      await page.reload({ waitUntil: 'domcontentloaded' });
      await expect(page.locator('[data-surface="ops-school-detail"]')).toBeVisible({ timeout: 60_000 });
      // the confirm must not have survived the reload, and the school must be untouched
      await expect(page.getByText(confirmTitle)).toHaveCount(0, { timeout: 20_000 });
      await expect(page.locator('[data-slot="ops-school-suspend"]')).toHaveAttribute('data-account-status', 'active', { timeout: 30_000 });
      await shot(page, 'extras-refresh-after-reload-active');
    } finally {
      await deleteFixtureSchool(page.request, fixture.id).catch(() => {});
    }
  });

  test('F2-X4 browser-back after an out-of-band delete: no stale row lingers', async () => {
    const fixture = await createEmptySchool(page.request);
    console.log(`[fleet2] back-after-delete fixture ${fixture.name} = ${fixture.id}`);
    // land on the list filtered to the fixture, then open the detail
    await gotoRetry(page, `/dashboard/ops/schools?q=${encodeURIComponent(fixture.name)}`, () =>
      expect(page.locator('[data-surface="ops-schools"]')).toBeVisible({ timeout: 60_000 }),
    );
    const row = page.locator('[data-directory-row]', { hasText: fixture.name }).first();
    await expect(row).toBeVisible({ timeout: 30_000 });
    await shot(page, 'extras-back-delete-row-before');
    await row.getByRole('link').first().click();
    await expect(page.locator('[data-surface="ops-school-detail"]')).toBeVisible({ timeout: 60_000 });

    // delete OUT OF BAND (another operator tab would do the same)
    const jwt = await opsJwt(page.request);
    const del = await page.request.delete(`${API}/api/ops/schools/${fixture.id}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    expect(del.status(), 'empty fixture delete').toBeLessThan(300);

    // the detail page now points at a ghost — back to the list
    await page.goBack({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-surface="ops-schools"]')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('[data-directory-row]', { hasText: fixture.name })).toHaveCount(0, { timeout: 30_000 });
    await shot(page, 'extras-back-delete-row-gone');
  });

  test('F2-X5 school_admin is bounced off /dashboard/ops (cross-check)', async () => {
    const adminPage = await page.context().browser()!.newPage();
    adminPage.setDefaultTimeout(30_000);
    try {
      await loginAs(adminPage, 'schoolAdmin');
      await adminPage.goto('/dashboard/ops/schools');
      await expect(adminPage).not.toHaveURL(/\/dashboard\/ops/, { timeout: 30_000 });
      await expect(adminPage).toHaveURL(/\/dashboard/, { timeout: 30_000 });
      await shot(adminPage, 'extras-schooladmin-bounced');
    } finally {
      await adminPage.close();
    }
  });
});
