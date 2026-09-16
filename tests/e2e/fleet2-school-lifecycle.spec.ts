/**
 * FLEET2 scratch — ops school LIFECYCLE, live browser proof.
 *
 * Creates a fixture school F2-<epoch> through the REAL create dialog, renames
 * it through the edit dialog, suspends + reactivates it through the confirm
 * dialogs, archives it through the typed-name confirm (with the wrong-text
 * refusal captured), then exercises DELETE: the with-data refusal (API must
 * refuse clearly) and the empty-school delete, after which the list must not
 * list it. Every step (happy AND unhappy) screenshots into
 * tests/e2e/captures/fleet2/.
 *
 * The UI offers no delete CTA anywhere (by design — recorded as screenshots);
 * DELETE is driven against /api/ops/schools/:id with an ops JWT, the same
 * endpoint the platform documents for operators.
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
const SCHOOL_NAME = `F2-${EPOCH}`;
const RENAMED = `F2-${EPOCH} Renamed`;

let shotIndex = 40; // 01-19 list, 20-39 detail
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

async function searchSchool(page: Page, text: string): Promise<void> {
  const search = page.getByTestId('ops-schools-search');
  await search.fill('');
  await search.fill(text);
  await page.waitForTimeout(600);
}

function schoolRow(page: Page, name: string) {
  return page.locator('[data-directory-row]', { hasText: name }).first();
}

/** Choose an option in one of the dialog's Base-UI selects and VERIFY it stuck. */
async function chooseSelect(
  page: Page,
  dialog: ReturnType<Page['locator']>,
  id: string,
  optionLabel: string,
): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt++) {
    await dialog.locator(`#${id}`).click();
    const option = page.getByRole('option', { name: optionLabel, exact: true }).first();
    await option.click();
    await page.waitForTimeout(200);
    const triggerText = (await dialog.locator(`#${id}`).innerText()).trim();
    if (triggerText === optionLabel) return;
    await page.waitForTimeout(400);
  }
  await expect(
    dialog.locator(`#${id}`),
    `select #${id} must show the chosen option`,
  ).toHaveText(new RegExp(optionLabel), { timeout: 5_000 });
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

/**
 * Portal-active requires terminal onboarding (the precedence the detail header
 * renders): walk the real link → complete wizard over the API, exactly the
 * route the ops onboarding surface drives.
 */
async function onboardSchool(request: APIRequestContext, documentId: string): Promise<void> {
  const jwt = await opsJwt(request);
  const link = await request.post(`${API}/api/schools/${documentId}/onboarding-link`, {
    headers: { Authorization: `Bearer ${jwt}`, 'X-Ops-Portal-Version': '1' },
    data: {
      first_name: 'F2',
      last_name: 'Owner',
      contact_email: `f2-owner-${EPOCH}@schooltest.local`,
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
        last_name: 'Owner',
        email: `f2-owner-${EPOCH}@schooltest.local`,
        password: 'F2Owner123!setup',
      },
      teachers: [],
    },
  });
  expect(complete.status(), await complete.text()).toBe(200);
}


/** Delete the fixture's onboarded owner account (if any), then the school. */
async function deleteFixtureSchool(request: APIRequestContext, documentId: string): Promise<number> {
  const jwt = await opsJwt(request);
  const ownerEmail = `f2-owner-${EPOCH}@schooltest.local`;
  const found = await request.get(
    `${API}/api/ops/users?q=${encodeURIComponent(ownerEmail)}&pageSize=5`,
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

test.describe('F2 ops school lifecycle', () => {
  test.describe.configure({ mode: 'serial' });
  let page: Page;
  let documentId = '';
  let studentIds: string[] = [];

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
    // leave nothing behind: the fixture must already be deleted; this is the safety net
    if (documentId) {
      await deleteFixtureSchool(page.request, documentId).catch(() => {});
    }
    await page.close();
  });

  test('F2-C1 create dialog validates empty submit inline (unhappy)', async () => {
    await gotoRetry(page, '/dashboard/ops/schools', () =>
      expect(page.locator('[data-surface="ops-schools"]')).toBeVisible({ timeout: 60_000 }),
    );
    await page.getByTestId('ops-create-school').click();
    const dialog = page.locator('[data-slot="ops-create-school-dialog"]');
    await expect(dialog).toBeVisible({ timeout: 20_000 });
    await shot(page, 'lifecycle-create-dialog-open');
    let posted = false;
    page.on('request', (req) => {
      if (req.url().includes('/api/schools') && req.method() === 'POST') posted = true;
    });
    await dialog.getByRole('button', { name: cat(en, 'Ops.createSchool.submit'), exact: true }).click();
    await expect(dialog.locator('#create-school-name')).toHaveAttribute('aria-invalid', 'true', { timeout: 10_000 });
    await page.waitForTimeout(1_000);
    expect(posted, 'an empty create form must never POST /api/schools').toBe(false);
    await shot(page, 'lifecycle-create-dialog-validation');
    // recover: fill the real fixture data (screenshot of the filled form)
    await dialog.locator('#create-school-name').fill(SCHOOL_NAME);
    await dialog.locator('#create-school-suburb').fill('Fleetville');
    await chooseSelect(page, dialog, 'create-school-state', 'NSW');
    await chooseSelect(page, dialog, 'create-school-sector', 'Government');
    await chooseSelect(page, dialog, 'create-school-plan', 'Standard');
    await chooseSelect(page, dialog, 'create-school-status', 'Active');
    await dialog.locator('#create-school-contact-name').fill('F2 Lifecycle Owner');
    await dialog.locator('#create-school-contact-email').fill(`f2-lifecycle-${EPOCH}@schooltest.local`);
    await dialog.locator('#create-school-phone').fill('0299990001');
    await page.waitForTimeout(200);
    await shot(page, 'lifecycle-create-dialog-filled');
    await dialog.getByRole('button', { name: cat(en, 'Ops.createSchool.submit'), exact: true }).click();
    await expect(dialog).not.toBeVisible({ timeout: 30_000 });
    await shot(page, 'lifecycle-create-success');
  });

  test('F2-C2 the created school is listed and its detail opens', async () => {
    await gotoRetry(page, `/dashboard/ops/schools?q=${encodeURIComponent(SCHOOL_NAME)}`, () =>
      expect(page.locator('[data-surface="ops-schools"]')).toBeVisible({ timeout: 60_000 }),
    );
    const row = schoolRow(page, SCHOOL_NAME);
    await expect(row).toBeVisible({ timeout: 30_000 });
    await shot(page, 'lifecycle-created-in-list');
    const href = await row.getByRole('link').first().getAttribute('href');
    documentId = (href ?? '').split('/').pop() ?? '';
    console.log(`[fleet2] created ${SCHOOL_NAME} -> ${documentId}`);
    expect(documentId, 'row links to the detail route').not.toBe('');
    await row.getByRole('link').first().click();
    await expect(page.locator('[data-surface="ops-school-detail"]')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole('heading', { name: SCHOOL_NAME })).toBeVisible();
    await shot(page, 'lifecycle-created-detail');

    // server policy: a dialog-created school is account_status 'invited' until
    // its owner invitation is accepted. The lifecycle chain below needs an
    // ACTIVE school — drive the portal's own Activate action (⋯ menu) so the
    // promotion is real UI proof, not a backdoor write.
    const suspendPanel = page.locator('[data-slot="ops-school-suspend"]');
    await expect(suspendPanel).toBeVisible({ timeout: 30_000 });
    const accountStatus = await suspendPanel.getAttribute('data-account-status');
    console.log(`[fleet2] created school account_status=${accountStatus}`);
    if (accountStatus !== 'active') {
      const primaryActivate = page.locator('[data-action="primary-activate"]');
      if (await primaryActivate.count()) {
        await primaryActivate.click();
      } else {
        await page.getByRole('button', { name: cat(en, 'Ops.detail.actions.menuLabel') }).click();
        await page.getByRole('menuitem', { name: cat(en, 'Ops.detail.actions.activate') }).click();
      }
      const confirmTitle = cat(en, 'Ops.detail.actions.confirm.activate.title').replace('{name}', SCHOOL_NAME);
      await expect(page.getByText(confirmTitle)).toBeVisible({ timeout: 20_000 });
      await shot(page, 'lifecycle-activate-confirm');
      await page.getByRole('button', { name: cat(en, 'Ops.detail.actions.confirm.activate.cta') }).click();
      await expect(suspendPanel).toHaveAttribute('data-account-status', 'active', { timeout: 30_000 });
      await shot(page, 'lifecycle-activated');
    }
  });

  test('F2-C3 rename through the edit dialog persists across a reload', async () => {
    await gotoRetry(page, `/dashboard/ops/schools/${documentId}`, () =>
      expect(page.locator('[data-surface="ops-school-detail"]')).toBeVisible({ timeout: 60_000 }),
    );
    await page.getByTestId('ops-edit-school').click();
    const dialog = page.locator('[data-slot="ops-edit-school-dialog"]');
    await expect(dialog).toBeVisible({ timeout: 30_000 });
    await dialog.locator('#edit-school-name').fill(RENAMED);
    await shot(page, 'lifecycle-edit-dialog-filled');
    const patchPromise = page.waitForResponse(
      (r) => new URL(r.url()).pathname === `/api/schools/${documentId}` && r.request().method() === 'PATCH',
      { timeout: 20_000 },
    ).catch(() => null);
    await dialog.getByRole('button', { name: cat(en, 'Ops.createSchool.save'), exact: true }).click();
    const patch = await patchPromise;
    console.log(`[fleet2] rename PATCH -> ${patch ? patch.status() : 'no request'}`);
    expect(patch?.status(), 'rename reaches the versioned PATCH endpoint').toBe(200);
    await expect(dialog).not.toBeVisible({ timeout: 30_000 });
    await gotoRetry(page, `/dashboard/ops/schools/${documentId}`, () =>
      expect(page.locator('[data-surface="ops-school-detail"]')).toBeVisible({ timeout: 60_000 }),
    );
    await expect(page.getByRole('heading', { name: RENAMED })).toBeVisible({ timeout: 20_000 });
    await shot(page, 'lifecycle-renamed-persisted');
  });

  test('F2-C4 suspend through the confirm dialog flips the school (happy)', async () => {
    // portal-active requires terminal onboarding — walk the real wizard first
    await onboardSchool(page.request, documentId);
    await gotoRetry(page, `/dashboard/ops/schools/${documentId}`, () =>
      expect(page.locator('[data-surface="ops-school-detail"]')).toBeVisible({ timeout: 60_000 }),
    );
    await expect(page.locator('[data-slot="ops-school-suspend"]')).toHaveAttribute('data-portal-status', 'active', { timeout: 30_000 });
    await shot(page, 'lifecycle-portal-active-before-suspend');
    await page.locator('[data-action="primary-suspend"]').click();
    const confirmTitle = cat(en, 'Ops.detail.actions.confirm.suspend.title').replace('{name}', RENAMED);
    await expect(page.getByText(confirmTitle)).toBeVisible({ timeout: 20_000 });
    await shot(page, 'lifecycle-suspend-confirm');
    await page.getByRole('button', { name: cat(en, 'Ops.detail.actions.confirm.suspend.cta') }).click();
    await expect(page.getByText(cat(en, 'Ops.detail.banner.suspended.title'))).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('[data-slot="ops-school-suspend"]')).toHaveAttribute('data-account-status', 'suspended', { timeout: 30_000 });
    await shot(page, 'lifecycle-suspended-banner');
  });

  test('F2-C5 reactivate from the suspended banner restores access (happy)', async () => {
    await expect(page.getByText(cat(en, 'Ops.detail.banner.suspended.title'))).toBeVisible({ timeout: 30_000 });
    await page.getByTestId('ops-banner-cta').click();
    const confirmTitle = cat(en, 'Ops.detail.actions.confirm.reactivate.title').replace('{name}', RENAMED);
    await expect(page.getByText(confirmTitle)).toBeVisible({ timeout: 20_000 });
    await shot(page, 'lifecycle-reactivate-confirm');
    await page.getByRole('button', { name: cat(en, 'Ops.detail.actions.confirm.reactivate.cta') }).click();
    await expect(page.getByText(cat(en, 'Ops.detail.banner.suspended.title'))).not.toBeVisible({ timeout: 30_000 });
    await expect(page.locator('[data-slot="ops-school-suspend"]')).toHaveAttribute('data-account-status', 'active', { timeout: 30_000 });
    await shot(page, 'lifecycle-reactivated');
  });

  test('F2-C6 archive typed-name confirm: wrong text refuses (unhappy), right text archives', async () => {
    await gotoRetry(page, `/dashboard/ops/schools/${documentId}`, () =>
      expect(page.locator('[data-surface="ops-school-detail"]')).toBeVisible({ timeout: 60_000 }),
    );
    await page.getByRole('button', { name: cat(en, 'Ops.detail.actions.menuLabel') }).click();
    await page.getByRole('menuitem', { name: cat(en, 'Ops.detail.actions.archive') }).click();
    const typed = page.locator('#ops-typed-name-confirm');
    await expect(typed).toBeVisible({ timeout: 20_000 });
    const cta = page.getByRole('button', { name: cat(en, 'Ops.detail.actions.confirm.archive.cta') });
    await typed.fill('Wrong Name');
    await expect(page.getByText(cat(en, 'Ops.detail.suspend.archiveNameMismatch'))).toBeVisible();
    await expect(cta).toBeDisabled();
    await shot(page, 'lifecycle-archive-wrong-text-refused');
    await typed.fill(RENAMED);
    await expect(cta).toBeEnabled({ timeout: 10_000 });
    await cta.click();
    await expect(page.getByText(cat(en, 'Ops.detail.banner.archived.title'))).toBeVisible({ timeout: 30_000 });
    await shot(page, 'lifecycle-archived-banner');
    // restore through the archived banner's CTA so the fixture is manageable again
    await page.getByTestId('ops-banner-cta').click();
    await page.getByRole('button', { name: cat(en, 'Ops.detail.actions.confirm.restore.cta') }).click();
    await expect(page.getByText(cat(en, 'Ops.detail.banner.archived.title'))).not.toBeVisible({ timeout: 30_000 });
    await shot(page, 'lifecycle-restored');
  });

  test('F2-C7 DELETE a NON-EMPTY school is refused clearly (unhappy, API-level)', async () => {
    // make the fixture non-empty: one linked student through the sanctioned API
    const jwt = await opsJwt(page.request);
    const create = await page.request.post(`${API}/api/students`, {
      headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
      data: {
        data: {
          given_name: 'F2',
          family_name: `DeleteGuard ${EPOCH}`,
          email: `f2-delete-guard-${EPOCH}@schooltest.local`,
          year_level: 7,
          first_language: 'english',
          status: 'active',
          school: documentId,
        },
      },
    });
    const createBody = (await create.json()) as { data?: { documentId?: string } };
    expect(create.status(), JSON.stringify(createBody)).toBeLessThan(300);
    const studentDoc = createBody.data?.documentId ?? '';
    studentIds = studentDoc ? [studentDoc] : [];

    const del = await page.request.delete(`${API}/api/ops/schools/${documentId}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    const body = (await del.text()).slice(0, 300);
    console.log(`[fleet2] DELETE non-empty school -> HTTP ${del.status()} ${body}`);
    expect(del.status(), `with-data delete must be refused with 4xx, got ${del.status()} ${body}`).toBeGreaterThanOrEqual(400);
    expect(del.status(), 'refusal must be a client error (the school exists)').toBeLessThan(500);
    expect(body, 'the refusal must name a reason').toMatch(/student|school|associated|empty|not/i);
    // the school survives in the UI
    await gotoRetry(page, `/dashboard/ops/schools?q=${encodeURIComponent(RENAMED)}`, () =>
      expect(page.locator('[data-surface="ops-schools"]')).toBeVisible({ timeout: 60_000 }),
    );
    await expect(schoolRow(page, RENAMED)).toBeVisible({ timeout: 20_000 });
    await shot(page, 'lifecycle-delete-refused-school-still-listed');
  });

  test('F2-C8 DELETE the emptied fixture succeeds and the list drops the row', async () => {
    const jwt = await opsJwt(page.request);
    // remove the guard student first (sanctioned cleanup), then delete
    for (const id of studentIds) {
      const res = await page.request.delete(`${API}/api/students/${id}`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      console.log(`[fleet2] cleanup student ${id} -> ${res.status()}`);
    }
    const status = await deleteFixtureSchool(page.request, documentId);
    console.log(`[fleet2] DELETE emptied fixture -> HTTP ${status}`);
    expect(status, 'emptied fixture delete must succeed').toBeLessThan(300);

    // fresh navigation: the deleted school must not be listed
    await gotoRetry(page, `/dashboard/ops/schools?q=${encodeURIComponent(`F2-${EPOCH}`)}`, () =>
      expect(page.locator('[data-surface="ops-schools"]')).toBeVisible({ timeout: 60_000 }),
    );
    await expect(page.getByText(cat(en, 'Ops.schools.emptySearchTitle'))).toBeVisible({ timeout: 30_000 });
    await shot(page, 'lifecycle-deleted-gone-from-list');
    documentId = ''; // nothing left for the safety net
  });
});
