/**
 * OPS-013 / C-OPS-PORTAL-003 — the ops schools page Create School modal.
 *
 * Everything is real: a genuine ops sign-in through the app's own form, the
 * running Next app posting the contracted versioned body to the running Strapi,
 * and the created school proved by a full reload and a fresh API-filtered
 * search — never by the toast, which the suite never reads.
 *
 * Copy note: the `Ops.createSchool.*` messages are a shared-file patch this
 * task returns rather than applies (schooltest-web/src/i18n/messages/en.json is
 * merge-only), so the selects render their key paths as labels. This suite
 * therefore picks options by DOM order, never by rendered text, and asserts
 * structure and behaviour, not copy.
 */
import { expect, test, type Page } from '@playwright/test';

import { cleanupSchool, opsJwt } from '../helpers/ops-onboarding';
import { loginAs } from '../helpers/roles';

const DESKTOP = { width: 1440, height: 1000 };
const MOBILE = { width: 375, height: 900 };
const ACT = 10_000;

const PAGE = '/dashboard/ops/schools';
const dialog = '[data-slot="ops-create-school-dialog"]';
// The header button renders data-testid (ops-create-school), not a
// data-action attribute — the mount point is the table header row.
const trigger = '[data-testid="ops-create-school"]';
const table = '[data-slot="ops-schools"]';
const search = '#ops-schools-search';

const CAPTURES =
  '../.codephant/missions/msn-ab5a6a54-f385-42e1-826a-aeba2bbdbc66/captures/ops-013';

const API = process.env.E2E_API_BASE_URL ?? 'http://127.0.0.1:5500';

/**
 * The API runs under `strapi develop` on a machine where other suites are
 * editing its source, so its watcher restarts it without warning, and its
 * 120 req/60s per-IP limiter is shared with every one of them. A dropped
 * connection or a 429 during FIXTURE SETUP is that neighbour traffic, not a
 * contract failure — wait past the limiter's window and try again. A persistent
 * failure still surfaces, unchanged, and nothing the tests assert is retried.
 */
async function whenApiReady<T>(action: () => Promise<T>): Promise<T> {
  let last: unknown;
  for (let attempt = 0; attempt < 9; attempt += 1) {
    try {
      const ready = await fetch(`${API}/api/readiness`);
      if (ready.ok) return await action();
    } catch (error) {
      last = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 8_000));
  }
  throw last ?? new Error(`[ops-013] API at ${API} never became ready`);
}

/** The documentId of the school the modal just created, found through the API. */
async function findSchoolIdByName(name: string): Promise<string> {
  return whenApiReady(async () => {
    const res = await fetch(`${API}/api/ops/schools?q=${encodeURIComponent(name)}&pageSize=5`, {
      headers: { Authorization: `Bearer ${await opsJwt()}` },
    });
    if (!res.ok) throw new Error(`[ops-013] schools search failed: ${res.status}`);
    const body = (await res.json()) as { data: { documentId: string; name: string }[] };
    const row = (body.data ?? []).find((entry) => entry.name === name);
    if (!row) throw new Error(`[ops-013] created school "${name}" not found via API`);
    return row.documentId;
  });
}

/**
 * The selects are base-ui Controllers whose options render as role="option" in
 * declaration order; `nth` picks one without depending on the (unmerged) i18n
 * labels. Order is fixed in OpsCreateSchoolFields: state codes NSW first,
 * sector government/catholic/non-government, plan pilot/standard/enterprise,
 * status pending_setup/trial/active.
 */
async function pick(page: Page, triggerId: string, optionIndex: number) {
  await page.locator(triggerId).click({ timeout: ACT });
  const option = page.getByRole('option').nth(optionIndex);
  await expect(option).toBeVisible({ timeout: ACT });
  await option.click({ timeout: ACT });
}

test.describe.configure({ retries: 1, timeout: 180_000 });

test.describe('C-OPS-PORTAL-003 create school modal', () => {
  test('rejects an empty submit with field-level errors and stays open', async ({ page }) => {
    await loginAs(page, 'ops');
    await page.setViewportSize(DESKTOP);
    await page.goto(PAGE);

    await page.locator(trigger).click({ timeout: ACT });
    const modal = page.locator(dialog);
    await expect(modal).toBeVisible({ timeout: ACT });

    await modal.locator('button[type="submit"]').click({ timeout: ACT });

    // The four required fields each carry their own error; the dialog stays
    // open so the operator can fix them. Nothing was submitted.
    await expect(page.locator('#create-school-name-error')).toBeVisible({ timeout: ACT });
    await expect(page.locator('#create-school-suburb-error')).toBeVisible({ timeout: ACT });
    await expect(page.locator('#create-school-contact-name-error')).toBeVisible({ timeout: ACT });
    await expect(page.locator('#create-school-contact-email-error')).toBeVisible({ timeout: ACT });
    await expect(modal).toBeVisible();
    await page.screenshot({ path: `${CAPTURES}/ops-013-desktop-validation.png` });

    await modal.getByRole('button', { name: /cancel/i }).click({ timeout: ACT });
    await expect(modal).toBeHidden({ timeout: ACT });
  });

  test('creates a school end to end and the row persists after reload', async ({ page }) => {
    const stamp = Date.now();
    const name = `E2E Create ${stamp}`;
    const email = `e2e-create-${stamp}@create.schooltest.local`;
    let documentId = '';

    try {
      await loginAs(page, 'ops');
      await page.setViewportSize(DESKTOP);
      await page.goto(PAGE);

      await page.locator(trigger).click({ timeout: ACT });
      const modal = page.locator(dialog);
      await expect(modal).toBeVisible({ timeout: ACT });

      await page.locator('#create-school-name').fill(name);
      await page.locator('#create-school-suburb').fill('Belmore');
      await pick(page, '#create-school-state', 0); // NSW
      await pick(page, '#create-school-sector', 0); // government
      await pick(page, '#create-school-plan', 1); // standard
      await pick(page, '#create-school-status', 0); // pending_setup
      await page.locator('#create-school-contact-name').fill('E2E Contact');
      await page.locator('#create-school-contact-email').fill(email);
      await page.locator('#create-school-phone').fill('02 9550 0000');

      await modal.locator('button[type="submit"]').click({ timeout: ACT });
      // Success closes the dialog; a 409 or validation failure would leave it
      // open with an inline error, so this wait IS the write assertion.
      await expect(modal).toBeHidden({ timeout: 30_000 });

      documentId = await findSchoolIdByName(name);

      // The list re-fetched after the mutation: an API-filtered search finds
      // the new row.
      await page.locator(search).fill(name);
      await expect(page.locator(table).getByText(name)).toBeVisible({ timeout: ACT });

      // The only assertion that proves persistence: a full reload, re-fetched
      // from the API, still lists the school.
      await page.reload();
      await page.locator(search).fill(name);
      await expect(page.locator(table).getByText(name)).toBeVisible({ timeout: ACT });
      await page.screenshot({ path: `${CAPTURES}/ops-013-desktop-created.png` });
    } finally {
      if (documentId) await whenApiReady(() => cleanupSchool(documentId));
    }
  });

  test('opens with the full form at desktop width', async ({ page }) => {
    await loginAs(page, 'ops');
    await page.setViewportSize(DESKTOP);
    await page.goto(PAGE);

    await page.locator(trigger).click({ timeout: ACT });
    const modal = page.locator(dialog);
    await expect(modal).toBeVisible({ timeout: ACT });
    // Every control the visual reference draws is present before any typing.
    await expect(page.locator('#create-school-name')).toBeVisible();
    await expect(page.locator('#create-school-suburb')).toBeVisible();
    await expect(page.locator('#create-school-state')).toBeVisible();
    await expect(page.locator('#create-school-sector')).toBeVisible();
    await expect(page.locator('#create-school-plan')).toBeVisible();
    await expect(page.locator('#create-school-status')).toBeVisible();
    await expect(page.locator('#create-school-contact-name')).toBeVisible();
    await expect(page.locator('#create-school-contact-email')).toBeVisible();
    await expect(page.locator('#create-school-phone')).toBeVisible();
    await page.screenshot({ path: `${CAPTURES}/ops-013-desktop-dialog.png` });

    await modal.getByRole('button', { name: /cancel/i }).click({ timeout: ACT });
    await expect(modal).toBeHidden({ timeout: ACT });
  });

  test('the dialog is usable at 375px', async ({ page }) => {
    await loginAs(page, 'ops');
    await page.setViewportSize(MOBILE);
    await page.goto(PAGE);

    await page.locator(trigger).click({ timeout: ACT });
    const modal = page.locator(dialog);
    await expect(modal).toBeVisible({ timeout: ACT });
    // No horizontal overflow at the narrow breakpoint.
    const box = await modal.boundingBox();
    expect(box).not.toBeNull();
    expect(box?.x ?? -1).toBeGreaterThanOrEqual(0);
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(MOBILE.width);
    await page.screenshot({ path: `${CAPTURES}/ops-013-mobile.png`, fullPage: true });

    // Cancelling without writing leaves no school behind.
    await modal.getByRole('button', { name: /cancel/i }).click({ timeout: ACT });
    await expect(modal).toBeHidden({ timeout: ACT });
  });
});
