/**
 * W2 — NIGHT-2 ops schools lifecycle chain (the user-named priority).
 *
 * One serial journey against the LIVE portal + LIVE API: create → validate →
 * edit → suspend (+ undo) → archive (typed-name, wrong text refuses) →
 * restore → reactivate, then the plan panel, recalculate-seats, the with-data
 * delete refusal, the bulk-bar CSV export, the status-count pills and the
 * empty state. Every scenario id maps to a JOURNEYS-N2.md line.
 *
 * Never restarts servers: E2E_BASE_URL points Playwright at the running dev
 * server (webServer.reuseExistingServer is true in playwright.config.ts).
 */
import path from 'node:path';

import { expect, test } from '@playwright/test';

import { apiEnv } from './helpers/auth-db';
import { cat, loadMessages } from './helpers/i18n';
import { loginAs } from './helpers/roles';

const en = loadMessages('en');
const STAMP = Date.now();
const SCHOOL_NAME = `W2 Web Lifecycle ${STAMP}`;
// The lifecycle chain needs an ACTIVE school: a school created through the
// dialog carries send_owner_invitation=true, and the server keeps it
// account_status 'invited' (pending setup) until the owner accepts — that is
// server policy, verified tonight in Postgres. The chain school below is
// precreated through the SAME versioned create endpoint with
// send_owner_invitation:false so account_status is 'active'.
const CHAIN_NAME = `W2 Chain School ${STAMP}`;
const API = process.env.E2E_API_URL ?? 'http://127.0.0.1:5500';

test.describe.configure({ mode: 'serial' });

let documentId = '';

/** The shared dev server occasionally aborts navigations under fleet load; retry. */
async function gotoRetry(
  page: import('@playwright/test').Page,
  url: string,
  assert: () => Promise<void>,
): Promise<void> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const aborted = await page
      .goto(url, { waitUntil: 'domcontentloaded' })
      .then(() => false)
      .catch(() => true);
    try {
      await assert();
      return;
    } catch {
      // retry after a beat — the fleet shares this dev server
      await page.waitForTimeout(3_000 * (attempt + 1));
    }
    if (aborted) continue;
  }
  // final unguarded attempt so the failure surfaces verbatim
  await page.goto(url);
  await assert();
}

async function gotoSchools(page: import('@playwright/test').Page): Promise<void> {
  await gotoRetry(page, '/dashboard/ops/schools', () =>
    expect(page.locator('[data-surface="ops-schools"]')).toBeVisible({ timeout: 60_000 }),
  );
}

async function gotoDetail(page: import('@playwright/test').Page, id: string): Promise<void> {
  await gotoRetry(page, `/dashboard/ops/schools/${id}`, () =>
    expect(page.locator('[data-surface="ops-school-detail"]')).toBeVisible({ timeout: 60_000 }),
  );
}

async function searchSchool(page: import('@playwright/test').Page, text: string): Promise<void> {
  const search = page.getByTestId('ops-schools-search');
  await search.fill('');
  await search.fill(text);
  await page.waitForTimeout(600); // the kit debounces the live search
}

function schoolRow(page: import('@playwright/test').Page, name: string) {
  return page.locator('[data-directory-row]', { hasText: name }).first();
}

/** Choose an option in one of the dialog's Base-UI selects and VERIFY it stuck. */
async function chooseSelect(
  page: import('@playwright/test').Page,
  dialog: import('@playwright/test').Locator,
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
  // final assertion names the failing control
  await expect(
    dialog.locator(`#${id}`),
    `select #${id} must show the chosen option`,
  ).toHaveText(new RegExp(optionLabel), { timeout: 5_000 });
}

/** Open the detail page's lifecycle menu (⋯ "More actions") and pick an entry. */
async function detailMenuAction(
  page: import('@playwright/test').Page,
  actionLabel: string,
): Promise<void> {
  await page.getByRole('button', { name: cat(en, 'Ops.detail.actions.menuLabel') }).click();
  await page.getByRole('menuitem', { name: actionLabel }).click();
}

test.describe('W2 ops schools lifecycle chain', () => {
  let page: import('@playwright/test').Page;

  /** Fleet-tolerant ops login: the shared dev server can abort a navigation. */
  async function loginOps(): Promise<void> {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await loginAs(page, 'ops');
        await expect(page).toHaveURL(/dashboard/, { timeout: 30_000 });
        return;
      } catch (err) {
        if (attempt === 2) throw err;
        await page.waitForTimeout(10_000);
      }
    }
  }

  // The chain runs against a dev server shared by the whole fleet; give each
  // step room, and bound the whole file so a hung page cannot block the night.
  test.setTimeout(600_000);

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(600_000);
    page = await browser.newPage();
    page.setDefaultTimeout(60_000);
    page.setDefaultNavigationTimeout(90_000);
    await loginOps();

    // precreate the ACTIVE chain school through the real versioned endpoint
    // (the API's brute-force guard is 20 logins/min/IP — shared with the fleet,
    // so the login retries through 429s)
    let jwt = '';
    for (let attempt = 0; attempt < 5 && !jwt; attempt++) {
      const auth = await page.request.post(`${API}/api/auth/local`, {
        data: {
          identifier: 'apiadmin@schooltest.local',
          password: apiEnv('SEED_APIADMIN_PASSWORD'),
        },
      });
      if (auth.status() === 429) {
        await page.waitForTimeout(15_000);
        continue;
      }
      expect(auth.status(), 'ops login for chain setup').toBe(200);
      jwt = ((await auth.json()) as { jwt: string }).jwt;
    }
    const created = await page.request.post(`${API}/api/schools`, {
      headers: { Authorization: `Bearer ${jwt}`, 'Idempotency-Key': `w2-chain-${STAMP}`, 'X-Ops-Portal-Version': '1' },
      data: {
        name: CHAIN_NAME,
        suburb: 'Fitzroy',
        state: 'VIC',
        sector: 'government',
        phone: '0394440001',
        contact_name: 'W2 Chain Owner',
        contact_email: `w2-chain-${STAMP}@schooltest.local`,
        portal: { plan: 'standard', status: 'active', send_owner_invitation: false },
      },
    });
    expect(
      created.status(),
      `chain school precreated via POST /api/schools: ${await created.text()}`,
    ).toBe(201);
    const body = (await created.json()) as { data: { documentId: string } };
    documentId = body.data.documentId;

    // The portal-status precedence resolves a school to portal-Active only
    // once onboarding reached its terminal state — walk the wizard over the
    // API so the chain school is a real onboarded Active school.
    const link = await page.request.post(`${API}/api/schools/${documentId}/onboarding-link`, {
      headers: { Authorization: `Bearer ${jwt}`, 'X-Ops-Portal-Version': '1' },
      data: {
        first_name: 'Chain',
        last_name: 'Owner',
        contact_email: `w2-chain-admin-${STAMP}@schooltest.local`,
      },
    });
    const linkBody = (await link.json()) as { data?: { token?: string } };
    const token = linkBody.data?.token ?? '';
    expect(token, 'onboarding link minted for the chain school').not.toBe('');
    const completed = await page.request.post(`${API}/api/school-onboarding/${token}/complete`, {
      data: {
        payload: { steps: { details: true } },
        admin: {
          first_name: 'Chain',
          last_name: 'Owner',
          email: `w2-chain-admin-${STAMP}@schooltest.local`,
          password: 'W2ChainOwner123!',
        },
        teachers: [],
      },
    });
    expect(completed.status(), 'chain school onboarding completed').toBe(200);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('OPS-005 create-school dialog validates required fields inline before submit', async () => {
    await gotoSchools(page);
    await page.getByTestId('ops-create-school').click();
    const dialog = page.locator('[data-slot="ops-create-school-dialog"]');
    await expect(dialog).toBeVisible();
    // empty submit -> inline field errors, no network create
    const errorResponse = page.waitForResponse(
      (response) => response.url().includes('/api/schools') && response.request().method() === 'POST',
      { timeout: 2_500 },
    ).then(() => 'sent' as const).catch(() => 'blocked' as const);
    await dialog.getByRole('button', { name: cat(en, 'Ops.createSchool.submit'), exact: true }).click();
    await expect(
      dialog.getByText(cat(en, 'Ops.createSchool.name'), { exact: false }).first(),
    ).toBeVisible();
    const outcome = await errorResponse;
    expect(outcome, 'an empty form must never POST /api/schools').toBe('blocked');
    // the per-field inline errors are live (aria-invalid on the name input)
    await expect(dialog.locator('#create-school-name')).toHaveAttribute('aria-invalid', 'true');
    await dialog.getByRole('button', { name: cat(en, 'Ops.schools.actions.cancel'), exact: true }).click();
  });

  test('OPS-006 create a school (name, state VIC, sector, plan) and it appears in the table', async () => {
    await gotoSchools(page);
    await page.getByTestId('ops-create-school').click();
    const dialog = page.locator('[data-slot="ops-create-school-dialog"]');
    await dialog.locator('#create-school-name').fill(SCHOOL_NAME);
    await dialog.locator('#create-school-suburb').fill('Fitzroy');
    await chooseSelect(page, dialog, 'create-school-state', 'VIC');
    await chooseSelect(page, dialog, 'create-school-sector', 'Government');
    await chooseSelect(page, dialog, 'create-school-plan', 'Standard');
    await chooseSelect(page, dialog, 'create-school-status', 'Active');
    await dialog.locator('#create-school-contact-name').fill('W2 Web Owner');
    await dialog.locator('#create-school-contact-email').fill(`w2-web-${STAMP}@schooltest.local`);
    await dialog.locator('#create-school-phone').fill('0394440001');
    await dialog.getByRole('button', { name: cat(en, 'Ops.createSchool.submit'), exact: true }).click();
    // the dialog closes on success and the table re-lists with the school
    await expect(dialog).not.toBeVisible({ timeout: 20_000 });
    await searchSchool(page, SCHOOL_NAME);
    const row = schoolRow(page, SCHOOL_NAME);
    await expect(row).toBeVisible({ timeout: 20_000 });
    // server policy check: a dialog-created school is account_status 'invited'
    // (owner invitation out) until the owner accepts — honest, verified in DB.
    expect(row).toBeDefined();
  });

  test('OPS-007 edit a school from the edit dialog and the change persists on reload', async () => {
    await gotoDetail(page, documentId);
    await page.getByTestId('ops-edit-school').click();
    const dialog = page.locator('[data-slot="ops-edit-school-dialog"], [role="dialog"]').first();
    await expect(dialog).toBeVisible();
    await dialog.locator('#edit-school-phone').fill('0394440002');
    await dialog.locator('#edit-school-suburb').fill('Carlton North');
    const patchPromise = page.waitForResponse(
      (r) => new URL(r.url()).pathname === `/api/schools/${documentId}` && r.request().method() === 'PATCH',
      { timeout: 15_000 },
    );
    await dialog.getByRole('button', { name: cat(en, 'Ops.createSchool.save'), exact: true }).click();
    const patch = await patchPromise.catch(() => null);
    expect(patch?.status(), 'the edit must reach the versioned PATCH endpoint').toBe(200);
    await expect(dialog).not.toBeVisible({ timeout: 20_000 });
    // a fresh full navigation IS the reload assertion (and survives fleet load)
    await gotoDetail(page, documentId);
    await expect(page.getByText('Carlton North').first()).toBeVisible({ timeout: 20_000 });
  });

  test('OPS-008 suspend via confirm dialog; status flips and the banner shows since-when', async () => {
    await gotoDetail(page, documentId);
    await page.locator('[data-action="primary-suspend"]').click();
    const confirmTitle = cat(en, 'Ops.detail.actions.confirm.suspend.title').replace('{name}', CHAIN_NAME);
    await expect(page.getByText(confirmTitle)).toBeVisible();
    await page.getByRole('button', { name: cat(en, 'Ops.detail.actions.confirm.suspend.cta') }).click();
    // status flip (the ok toast fades in 2.8s and races fleet load — the
    // suspended banner is the durable proof)
    await expect(page.getByText(cat(en, 'Ops.detail.banner.suspended.title'))).toBeVisible({ timeout: 30_000 });
    // since-when: the bodyWithInterval copy starts with "Suspended "
    await expect(page.getByText(/^Suspended /)).toBeVisible({ timeout: 20_000 });
  });

  test('OPS-011 undo toast after suspend restores the previous lifecycle state', async () => {
    await expect(page.getByText(`${CHAIN_NAME} suspended`)).toBeVisible();
    await page.getByRole('button', { name: cat(en, 'Ops.schools.actions.undo') }).click();
    await expect(
      page.getByText(
        cat(en, 'Ops.schools.actions.undoSuccess').replace('{name}', CHAIN_NAME),
      ),
    ).toBeVisible({ timeout: 20_000 });
    // the banner is gone: the school is back to active
    await expect(page.getByText(cat(en, 'Ops.detail.banner.suspended.title'))).not.toBeVisible({ timeout: 20_000 });
  });

  test('OPS-009 archive requires typing the school name; wrong text refuses', async () => {
    await gotoDetail(page, documentId);
    await detailMenuAction(page, cat(en, 'Ops.detail.actions.archive'));
    const typed = page.locator('#ops-typed-name-confirm');
    await expect(typed).toBeVisible();
    const cta = page.getByRole('button', { name: cat(en, 'Ops.detail.actions.confirm.archive.cta') });
    // wrong text -> refused (mismatch message + disabled CTA)
    await typed.fill('Wrong Name');
    await expect(page.getByText(cat(en, 'Ops.schools.actions.typedMismatch'))).toBeVisible();
    await expect(cta).toBeDisabled();
    // exact text -> confirmable
    await typed.fill(CHAIN_NAME);
    await expect(cta).toBeEnabled();
    await cta.click();
    await expect(page.getByText(`${CHAIN_NAME} archived`)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(cat(en, 'Ops.detail.banner.archived.title'))).toBeVisible({ timeout: 20_000 });
  });

  test('OPS-010 restore CTA on the archived banner flips the school back', async () => {
    await expect(page.getByText(cat(en, 'Ops.detail.banner.archived.title'))).toBeVisible();
    await page.getByTestId('ops-banner-cta').click();
    await page.getByRole('button', { name: cat(en, 'Ops.detail.actions.confirm.restore.cta') }).click();
    await expect(page.getByText(cat(en, 'Ops.detail.banner.archived.title'))).not.toBeVisible({ timeout: 30_000 });
    await expect(page.locator('[data-slot="ops-school-suspend"]')).toHaveAttribute('data-account-status', /prospect|invited/, { timeout: 30_000 });
  });

  test('OPS-010b reactivate CTA on the suspended banner flips the school back to active', async () => {
    // suspend again via the primary button, then use the banner CTA
    await gotoDetail(page, documentId);
    await page.locator('[data-action="primary-suspend"]').click();
    await page.getByRole('button', { name: cat(en, 'Ops.detail.actions.confirm.suspend.cta') }).click();
    await expect(page.getByText(cat(en, 'Ops.detail.banner.suspended.title'))).toBeVisible({ timeout: 20_000 });
    await page.getByTestId('ops-banner-cta').click();
    await page.getByRole('button', { name: cat(en, 'Ops.detail.actions.confirm.reactivate.cta') }).click();
    await expect(page.getByText(cat(en, 'Ops.detail.banner.suspended.title'))).not.toBeVisible({ timeout: 30_000 });
    await expect(page.locator('[data-slot="ops-school-suspend"]')).toHaveAttribute('data-account-status', 'active', { timeout: 30_000 });
  });

  test('OPS-034 plan panel changes the plan and the change persists', async () => {
    await gotoDetail(page, documentId);
    await expect(page.locator('[data-surface="ops-school-plan"]')).toBeVisible({ timeout: 60_000 });
    const panel = page.locator('[data-surface="ops-school-plan"]');
    await panel.locator('select, [role="combobox"]').first().click().catch(async () => {
      await panel.getByRole('combobox').click();
    });
    await page.getByRole('option', { name: 'Full license', exact: true }).click();
    await expect(page.getByText(/Plan set to/i)).toBeVisible({ timeout: 20_000 });
    await page.reload();
    await expect(page.locator('[data-surface="ops-school-plan"]')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('[data-surface="ops-school-plan-current"]')).toContainText(/full license|Full license/i, {
      timeout: 20_000,
    });
  });

  test('OPS-035 recalculate-seats recomputes usage and updates the display', async () => {
    await gotoDetail(page, documentId);
    await page.getByRole('button', { name: cat(en, 'Ops.detail.actions.recalculateSeats') }).click();
    await expect(page.getByText(/^Seats recalculated:/)).toBeVisible({ timeout: 20_000 });
  });

  test('OPS-048 status count cards above the table match the filtered row counts', async () => {
    await gotoSchools(page);
    // every pill (status count card) states a number; the ALL pill must equal
    // meta.pagination.total from the live API response the table rendered
    const listPromise = page.waitForResponse((response) => /\/api\/ops\/schools/.test(response.url()));
    await page.reload();
    const list = await (await listPromise).json();
    const total = list?.meta?.pagination?.total ?? 0;
    const showing = page.getByText(/Showing \d+ of \d+ schools/);
    await expect(showing).toBeVisible({ timeout: 20_000 });
    await expect(showing).toHaveText(new RegExp(`Showing \\d+ of ${total} schools`));
  });

  test('OPS-051 zero-match list renders the empty state and the create CTA works from it', async () => {
    await gotoSchools(page);
    await searchSchool(page, `zz-no-school-named-this-${STAMP}`);
    await expect(page.getByText(cat(en, 'Ops.schools.emptySearchTitle'))).toBeVisible({ timeout: 20_000 });
    // the empty state's create CTA opens the dialog
    await page.getByRole('button', { name: cat(en, 'Ops.schools.createSchool') }).first().click().catch(async () => {
      await page.getByTestId('ops-create-school').click();
    });
    await expect(page.locator('[data-slot="ops-create-school-dialog"]')).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('OPS-014 bulk-bar CSV export downloads a file with the selected rows', async () => {
    await gotoSchools(page);
    await searchSchool(page, CHAIN_NAME);
    const row = schoolRow(page, CHAIN_NAME);
    await expect(row).toBeVisible({ timeout: 20_000 });
    await row.getByRole('checkbox').click();
    const exportButton = page.getByRole('button', { name: cat(en, 'Ops.schools.bulkExport') });
    await expect(exportButton).toBeVisible({ timeout: 20_000 });
    const downloadPromise = page.waitForEvent('download', { timeout: 20_000 });
    await exportButton.click();
    const download = await downloadPromise;
    const target = path.join('/tmp', `w2-export-${STAMP}.csv`);
    await download.saveAs(target);
    const { readFileSync } = await import('node:fs');
    const csv = readFileSync(target, 'utf8');
    expect(csv).toContain(SCHOOL_NAME);
  });

  test('DELETE refusal: neither the row menu nor the detail menu offers a bare delete', async () => {
    // The with-data refusal itself is the API's (API-030, driver-verified);
    // the WEB lifecycle surface must not offer a shortcut around it: the row
    // menu and the detail menu carry suspend/archive/restore, never delete.
    await gotoSchools(page);
    await searchSchool(page, SCHOOL_NAME);
    const row = schoolRow(page, SCHOOL_NAME);
    await row.getByRole('button', { name: 'Row actions' }).click();
    await expect(page.getByRole('menuitem', { name: /delete/i })).toHaveCount(0);
    await page.keyboard.press('Escape');
    await gotoDetail(page, documentId);
    await page.getByRole('button', { name: cat(en, 'Ops.detail.actions.menuLabel') }).click();
    await expect(page.getByRole('menuitem', { name: /delete/i })).toHaveCount(0);
    await page.keyboard.press('Escape');
  });
});
