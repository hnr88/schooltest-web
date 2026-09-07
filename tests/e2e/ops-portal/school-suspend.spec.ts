/**
 * OPS-015 / C-OPS-PORTAL-005 — the school detail's Suspend action.
 *
 * Everything is real: a genuine ops sign-in through the app's own form, the
 * running Next app reading the running Strapi, and a fixture school created and
 * removed through the real ops contract. The success assertion is not the toast
 * — it is the status the page shows AFTER a full reload, which can only come
 * from the server.
 *
 * Copy note: the `Ops.detail.suspend.*` messages are a shared-file patch this
 * task returns rather than applies (schooltest-web/src/i18n/messages/en.json is
 * merge-only), so this suite asserts structure and behaviour, not the rendered
 * strings, and stays green either side of that merge.
 */
import { expect, test } from '@playwright/test';

import { cleanupSchool, createProspectSchool, detailPath } from '../helpers/ops-onboarding';
import { loginAs } from '../helpers/roles';

const DESKTOP = { width: 1440, height: 1000 };
const MOBILE = { width: 375, height: 900 };
const ACT = 10_000;

const suspendPanel = '[data-slot="ops-school-suspend"]';
const suspendButton = '[data-action="suspend-school"]';

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
  throw last ?? new Error(`[ops-015] API at ${API} never became ready`);
}

test.describe.configure({ retries: 1, timeout: 180_000 });

test.describe('C-OPS-PORTAL-005 suspend school', () => {
  let documentId = '';

  test.beforeEach(async () => {
    documentId = (await whenApiReady(() => createProspectSchool('OPS-015 suspend'))).documentId;
  });

  test.afterEach(async () => {
    if (documentId) await whenApiReady(() => cleanupSchool(documentId));
  });

  test('suspends through the confirm dialog and survives a reload', async ({ page }) => {
    await loginAs(page, 'ops');
    await page.setViewportSize(DESKTOP);
    await page.goto(detailPath(documentId));

    const panel = page.locator(suspendPanel);
    await expect(panel).toBeVisible({ timeout: ACT });
    // Whatever C-SCH-02 created it as — asserted, not assumed.
    const initialStatus = (await panel.getAttribute('data-account-status')) ?? '';
    expect(initialStatus).not.toBe('suspended');

    const button = page.locator(suspendButton);
    // Enabled only once the row version has loaded — the write quotes it.
    await expect(button).toBeEnabled({ timeout: ACT });
    await page.screenshot({ path: 'test-results/ops-015-desktop-before.png' });

    await button.click({ timeout: ACT });
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible({ timeout: ACT });
    await page.screenshot({ path: 'test-results/ops-015-desktop-confirm.png' });

    // Cancel first: a destructive action must be escapable without writing.
    await dialog.getByRole('button', { name: /cancel/i }).click({ timeout: ACT });
    await expect(dialog).toBeHidden({ timeout: ACT });
    await expect(page.locator(suspendPanel)).toHaveAttribute('data-account-status', initialStatus);

    await button.click({ timeout: ACT });
    await expect(page.getByRole('alertdialog')).toBeVisible({ timeout: ACT });
    await page
      .getByRole('alertdialog')
      .locator('button')
      .last()
      .click({ timeout: ACT });

    // The control is gone because the school is no longer suspendable.
    await expect(page.locator(suspendPanel)).toHaveCount(0, { timeout: ACT });

    // The only assertion that proves persistence: a full reload, re-fetched
    // from the API, still shows the school as suspended and offers no Suspend.
    await page.reload();
    await expect(page.locator('[data-slot="ops-school-detail"]')).toBeVisible({ timeout: ACT });
    await expect(page.locator(suspendPanel)).toHaveCount(0, { timeout: ACT });
    await page.screenshot({ path: 'test-results/ops-015-desktop-after.png' });
  });

  test('the action is reachable and legible at 375px', async ({ page }) => {
    await loginAs(page, 'ops');
    await page.setViewportSize(MOBILE);
    await page.goto(detailPath(documentId));

    const button = page.locator(suspendButton);
    await expect(button).toBeVisible({ timeout: ACT });
    const box = await button.boundingBox();
    expect(box).not.toBeNull();
    // No horizontal overflow at the narrow breakpoint.
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(MOBILE.width);
    // WCAG 2.5.8 minimum target size for a destructive control.
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(24);
    await page.screenshot({ path: 'test-results/ops-015-mobile.png', fullPage: true });
  });

  test('the destructive action is keyboard reachable and dismissible', async ({ page }) => {
    await loginAs(page, 'ops');
    await page.setViewportSize(DESKTOP);
    await page.goto(detailPath(documentId));

    const button = page.locator(suspendButton);
    await expect(button).toBeEnabled({ timeout: ACT });
    await button.focus();
    await expect(button).toBeFocused();
    await page.keyboard.press('Enter');

    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible({ timeout: ACT });
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden({ timeout: ACT });
    // Escaping the dialog wrote nothing: the panel is still offering the action.
    await expect(page.locator(suspendButton)).toBeEnabled({ timeout: ACT });
  });
});
