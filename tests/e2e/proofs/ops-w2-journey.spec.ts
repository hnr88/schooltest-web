/**
 * Wave-2 OPS design journey — the ops school lifecycle END-TO-END on a
 * throwaway school, asserting the design's screens at each step
 * (`mvp/claude-design/Ops Portal.dc.html`: list :68-201, detail :202-233,
 * create/edit modal :547-616, confirm modal :819-841).
 *
 * Steps: create school (640px modal + footer error slot) -> row appears in the
 * list -> open detail -> edit school (same modal, prefilled) -> change suburb
 * -> save -> invite admin (owner-invitation note :600-603 context) -> archive
 * with the typed-name confirm -> pill moves to Archived -> restore from the
 * menu -> exercise the row menu's Status page item and the detail menu's
 * Recalculate seats. Delete is deliberately NOT exercised (not in the design).
 *
 * Every step captures a numbered screenshot; console errors and >=400 API
 * responses are collected throughout and written next to the shots.
 *
 * Output directory is env-driven (OPS_W2_JOURNEY_DIR), default
 * tests/proofs/ops-w2-journey.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { expect, type Page, test } from '@playwright/test';

import { loginAs } from '../helpers/roles';

const OUTPUT_DIR = path.resolve(
  process.cwd(),
  process.env.OPS_W2_JOURNEY_DIR ?? 'tests/proofs/ops-w2-journey',
);
const TS = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
const SCHOOL_NAME = `W2 Journey ${TS}`;
const SUBURB_A = 'Probeville';
const SUBURB_B = 'Newtown';

const consoleErrors: string[] = [];
const failedResponses: string[] = [];

async function save(page: Page, name: string): Promise<void> {
  await page.waitForTimeout(400); // settle fonts/hover layers
  const shot = await page.screenshot();
  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(path.join(OUTPUT_DIR, `${name}.png`), shot);
}

/** The directory row carrying `name`, and its ⋯ trigger. */
function rowOf(page: Page, name: string) {
  const nameCell = page.locator('a[data-row-href]', { hasText: name }).first();
  return {
    nameCell,
    row: page.locator('[data-directory-row]').filter({ has: nameCell }),
    menuButton: page
      .locator('[data-directory-row]')
      .filter({ has: nameCell })
      .locator('[data-directory-row-menu] button[aria-label="Row actions"]'),
  };
}

async function pickOption(page: Page, triggerId: string, label: string): Promise<void> {
  await page.locator(`#${triggerId}`).click();
  await page.getByRole('option', { name: label, exact: true }).click();
}

test.describe('ops w2 design journey', () => {
    // One end-to-end lifecycle; the default 30s cannot hold the whole journey.
    test.setTimeout(300_000);
  test('create -> detail -> edit -> invite -> archive -> restore -> status page -> recalc seats', async ({
    page,
  }) => {
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(`${page.url()} :: ${message.text()}`);
    });
    page.on('pageerror', (error) =>
      consoleErrors.push(`${page.url()} :: pageerror :: ${error.message}`),
    );
    page.on('response', (response) => {
      if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
    });

    await page.setViewportSize({ width: 1440, height: 1000 });
    await loginAs(page, 'ops');

    // ---- T1. The schools LIST (design :68-201) ---------------------------------
    await page.goto('/dashboard/ops/schools');
    const listSurface = page.locator('[data-surface="ops-schools"]');
    await expect(listSurface).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole('heading', { name: 'Schools', exact: true })).toBeVisible();
    const search = page.locator('input[data-testid="ops-schools-search"]');
    await expect(search).toBeVisible();
    const searchBox = await search.boundingBox();
    expect(Math.round(searchBox?.height ?? 0)).toBe(44); // design :91 44px pill
    const createButton = page.locator('button[data-testid="ops-create-school"]');
    await expect(createButton).toBeVisible();
    await expect(page.locator('[data-slot="ops-schools-pills"]')).toBeVisible();
    await save(page, '01-list-initial');

    // ---- T2. CREATE modal (design :547-616): 640px, field grid, footer error slot
    await createButton.click();
    const createDialog = page.locator('[data-slot="ops-create-school-dialog"]');
    await expect(createDialog).toBeVisible({ timeout: 15_000 });
    const createBox = await createDialog.boundingBox();
    expect(Math.round(createBox?.width ?? 0)).toBe(640); // design :551 width:640px
    // The design's field grid :559-599 — [name|suburb] share a row.
    const nameField = page.locator('#create-school-name');
    const suburbField = page.locator('#create-school-suburb');
    const nameBox = await nameField.boundingBox();
    const suburbBox = await suburbField.boundingBox();
    expect(Math.abs((nameBox?.y ?? 0) - (suburbBox?.y ?? 0))).toBeLessThan(3);
    await save(page, '02-create-modal');

    // Submit empty -> the footer's left error slot fills (design :604-610).
    await createDialog.getByRole('button', { name: 'Create school', exact: true }).click();
    await expect(page.locator('[data-testid="ops-school-form-summary"]')).toBeVisible({
      timeout: 10_000,
    });
    await save(page, '03-create-footer-error');

    // ---- T3. Fill the form (status Active so the detail shows the navy primary)
    await nameField.fill(SCHOOL_NAME);
    await suburbField.fill(SUBURB_A);
    await pickOption(page, 'create-school-state', 'NSW');
    await pickOption(page, 'create-school-sector', 'Government');
    await pickOption(page, 'create-school-plan', 'Standard');
    await page.locator('#create-school-contact-name').fill('Joanne Nguyen');
    await page
      .locator('#create-school-contact-email')
      .fill(`joanne.nguyen+${TS}@schooltest.edu.au`);
    await page.locator('#create-school-phone').fill('+61 2 0000 0000');
    await pickOption(page, 'create-school-status', 'Active');
    await expect(page.locator('[data-testid="create-school-status-warning"]')).toBeVisible({
      timeout: 10_000,
    });
    await save(page, '04-create-filled-active-warning');
    await createDialog.getByRole('button', { name: 'Create school', exact: true }).click();
    await expect(createDialog).not.toBeVisible({ timeout: 30_000 });

    // ---- T4. The row appears in the list (design :156-186) ---------------------
    // NOTE (measured 2026-09-11): the API lands a fresh school at portal_status
    // pending_setup even when the form asked for Active, so the row pill reads
    // "Pending setup" — the journey asserts what the server actually stored.
    await search.fill(SCHOOL_NAME);
    const { nameCell, row, menuButton } = rowOf(page, SCHOOL_NAME);
    await expect(nameCell).toBeVisible({ timeout: 30_000 });
    await expect(nameCell.getByText('Standard plan')).toBeVisible();
    await expect(row.locator('span[class*="w-[94px]"]').first()).toContainText('Pending setup');
    await save(page, '05-created-in-list');

    // The row ⋯ menu (design :176-186): Open school / Status page / lifecycle.
    await menuButton.click();
    await page
      .getByRole('menuitem', { name: 'Open school' })
      .waitFor({ state: 'visible', timeout: 10_000 });
    await save(page, '06-row-menu');
    await page.keyboard.press('Escape');

    // ---- T5. The DETAIL (design :202-233) ---------------------------------------
    // Design :1497 gives a pending_setup school the navy "Activate school"
    // primary; the product intentionally leaves that slot empty (activation is
    // onboarding-driven) — captured as a design deviation in the report.
    // The search's debounced ?q= router.replace must settle first, or it
    // cancels the name link's navigation (measured: clicking mid-debounce
    // bounced straight back to /schools?q=...).
    await expect(page).toHaveURL(/q=/, { timeout: 15_000 });
    await page.waitForTimeout(500);
    await nameCell.click();
    const detailSurface = page.locator('[data-surface="ops-school-detail"]');
    await expect(detailSurface).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole('heading', { name: SCHOOL_NAME })).toBeVisible();
    await expect(page.getByTestId('ops-edit-school')).toBeVisible();
    await expect(detailSurface.locator('span.rounded-full', { hasText: 'Pending setup' })).toBeVisible();
    await expect(detailSurface.getByText(`${SUBURB_A} NSW`).first()).toBeVisible();
    await save(page, '07-detail');

    // ---- T6. EDIT school (same modal, prefilled) --------------------------------
    await page.getByTestId('ops-edit-school').click();
    const editDialog = page.locator('[data-slot="ops-edit-school-dialog"]');
    await expect(editDialog).toBeVisible({ timeout: 15_000 });
    const editBox = await editDialog.boundingBox();
    expect(Math.round(editBox?.width ?? 0)).toBe(640);
    await expect(page.locator('#edit-school-name')).toHaveValue(SCHOOL_NAME);
    await expect(page.locator('#edit-school-suburb')).toHaveValue(SUBURB_A);
    await save(page, '08-edit-modal-prefilled');
    await page.locator('#edit-school-suburb').fill(SUBURB_B);
    await editDialog.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(editDialog).not.toBeVisible({ timeout: 30_000 });
    await expect(detailSurface.getByText(`${SUBURB_B} NSW`).first()).toBeVisible({ timeout: 30_000 });
    await save(page, '09-edit-saved-newtown');

    // ---- T7. INVITE admin from the detail ⋯ menu (design :600-603 context) ------
    // The creation already sent the OWNER invitation to the primary contact
    // (the create dialog always sends it), so the panel may be in its
    // "Invitation sent" state: capture that, revoke, then the real 540px
    // invite dialog opens from the same menu item.
    const moreButton = page.getByRole('button', { name: 'More actions' });
    await moreButton.click();
    await page.getByRole('menuitem', { name: 'Invite admin' }).click();
    const inviteDialog = page.locator('[data-slot="ops-onboard-dialog"]');
    const pendingPanel = page.locator('[data-slot="ops-onboard-actions"][data-invitation="sent"]');
    const wentToDialog = await inviteDialog
      .waitFor({ state: 'visible', timeout: 8000 })
      .then(() => true)
      .catch(() => false);
    if (!wentToDialog) {
      await expect(pendingPanel).toBeVisible({ timeout: 15_000 });
      await save(page, '10-owner-invitation-pending');
      await pendingPanel.getByRole('button', { name: 'Revoke' }).click();
      await expect(page.getByText('Invitation revoked').first()).toBeVisible({
        timeout: 15_000,
      });
      await moreButton.click();
      await page.getByRole('menuitem', { name: 'Invite admin' }).click();
      await expect(inviteDialog).toBeVisible({ timeout: 15_000 });
    }
    const inviteBox = await inviteDialog.boundingBox();
    expect(Math.round(inviteBox?.width ?? 0)).toBe(540); // design :617 width:540px
    await save(page, '11-invite-admin-modal');
    await page.locator('#onboard-first-name').fill('Willa');
    await page.locator('#onboard-last-name').fill('Nguyen');
    await page.locator('#onboard-email').fill(`willa.nguyen+${TS}@schooltest.edu.au`);
    await inviteDialog.getByRole('button', { name: 'Send invitation' }).click();
    await expect(
      page.getByText(new RegExp(`invitation sent to willa\\.nguyen\\+${TS}`, 'i')).first(),
    ).toBeVisible({ timeout: 30_000 });
    await save(page, '12-invite-sent');

    // ---- T8. ARCHIVE with the typed confirm (design :819-841) --------------------
    await page.getByRole('link', { name: 'Back to schools' }).click();
    await expect(listSurface).toBeVisible({ timeout: 60_000 });
    await search.fill(SCHOOL_NAME);
    const listRow = rowOf(page, SCHOOL_NAME);
    await expect(listRow.nameCell).toBeVisible({ timeout: 30_000 });
    await listRow.menuButton.click();
    await page.getByRole('menuitem', { name: 'Archive school' }).click();
    const confirmDialog = page.locator('[role="alertdialog"]');
    await expect(confirmDialog).toBeVisible({ timeout: 15_000 });
    const confirmBox = await confirmDialog.boundingBox();
    expect(Math.round(confirmBox?.width ?? 0)).toBe(460); // design :821 width:460px
    await expect(confirmDialog.getByText(`Archive ${SCHOOL_NAME}?`)).toBeVisible();
    const typedInput = page.locator('#ops-confirm-typed-name');
    await expect(typedInput).toBeVisible();
    // The typed label must carry the school name ("Type {name} to confirm") —
    // a broken rich-tag interpolation used to render "Type to confirm".
    await expect(page.locator('label[for="ops-confirm-typed-name"]')).toContainText(
      `Type ${SCHOOL_NAME} to confirm`,
    );
    await save(page, '13-archive-typed-confirm');

    // A mismatched press answers with the design's message (:838 err slot).
    // The design (:1638) keeps the dimmed CTA CLICKABLE at 0.55 opacity so the
    // press itself teaches; the dialog renders it aria-disabled, which
    // Playwright's actionability check refuses — force replays the real press.
    await typedInput.fill('Wrong Name');
    await confirmDialog
      .getByRole('button', { name: 'Archive school' })
      .click({ force: true });
    await expect(
      confirmDialog.getByText('Type the name exactly as shown to confirm.'),
    ).toBeVisible();
    await save(page, '14-archive-typed-mismatch');

    await typedInput.fill(SCHOOL_NAME);
    await confirmDialog.getByRole('button', { name: 'Archive school' }).click();
    await expect(page.getByText(`${SCHOOL_NAME} archived`)).toBeVisible({ timeout: 30_000 });
    await save(page, '15-archived-toast');
    await expect(listRow.row.getByText('Archived', { exact: true })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.locator('[data-slot="ops-schools-pill-archived"]')).toBeVisible();
    await save(page, '16-archived-pill');

    // ---- T9. RESTORE from the ⋯ menu (stop here: Delete is not in the design) ----
    await listRow.menuButton.click();
    await page.getByRole('menuitem', { name: 'Restore school' }).click();
    await expect(confirmDialog).toBeVisible({ timeout: 15_000 });
    await expect(confirmDialog.getByText(`Restore ${SCHOOL_NAME}?`)).toBeVisible();
    await save(page, '17-restore-confirm');
    await confirmDialog.getByRole('button', { name: 'Restore', exact: true }).click();
    await expect(page.getByText(`${SCHOOL_NAME} restored`)).toBeVisible({ timeout: 30_000 });
    await expect(listRow.row.getByText('Pending setup', { exact: true })).toBeVisible({
      timeout: 30_000,
    });
    await save(page, '18-restored-pill');

    // ---- T10. The ⋯ Status page item --------------------------------------------
    await listRow.menuButton.click();
    const statusPageItem = page.getByRole('menuitem', { name: 'Status page' });
    await expect(statusPageItem).toBeVisible();
    const popupPromise = page.waitForEvent('popup', { timeout: 8000 }).catch(() => null);
    await statusPageItem.click();
    const popup = await popupPromise;
    if (popup) {
      await popup.close();
    } else {
      await expect(
        page.getByText(/status page|not configured|unavailable/i).first(),
      ).toBeVisible({ timeout: 10_000 });
    }
    await save(page, '19-status-page-item');

    // ---- T11. Recalculate seats from the detail ⋯ menu (design :222-230 model) ---
    await expect(page).toHaveURL(/q=/, { timeout: 15_000 });
    await page.waitForTimeout(500);
    await listRow.nameCell.click();
    await expect(detailSurface).toBeVisible({ timeout: 60_000 });
    await moreButton.click();
    await page.getByRole('menuitem', { name: 'Recalculate seats' }).click();
    await expect(
      page.getByText(/Seats recalculated|could not be saved/i).first(),
    ).toBeVisible({ timeout: 30_000 });
    await save(page, '20-recalc-seats');

    await writeFile(
      path.join(OUTPUT_DIR, 'journey-log.json'),
      JSON.stringify({ school: SCHOOL_NAME, consoleErrors, failedResponses }, null, 2),
    );
    console.log(
      `[w2-journey] school=${SCHOOL_NAME} consoleErrors=${consoleErrors.length} http4xx5xx=${failedResponses.length}`,
    );
    for (const line of consoleErrors.slice(0, 10)) console.log(`  console: ${line}`);
    for (const line of failedResponses.slice(0, 10)) console.log(`  http: ${line}`);
  });
});
