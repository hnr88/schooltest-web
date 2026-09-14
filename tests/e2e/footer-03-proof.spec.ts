/**
 * Task 03 (landing-pages) proof tooling — re-pointed at the redesigned footer.
 *
 * The footer is now the hardcoded `footer[data-screen-label="Footer"]` (the
 * old `footer.bg-navy-900` and the utility bar's own footer are gone). The
 * acknowledgement line, the "Page last updated" date and the piloting chip are
 * hardcoded English, so they render IDENTICALLY under every locale prefix —
 * the cross-locale assertion flips from "translated copy" to "the same
 * locale-independent copy".
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type Locator } from '@playwright/test';

const SHOTS_DIR = path.resolve(process.cwd(), '..', 'mvp', 'landing-pages', 'proof', 'shots');

const ACKNOWLEDGEMENT =
  'SchoolTest acknowledges the Traditional Custodians of the lands on which Australian schools stand, and pays respect to Elders past and present.';
const LAST_UPDATED = 'Page last updated 31 August 2026';

async function shoot(footer: Locator, name: string): Promise<void> {
  const shot = await footer.screenshot({ type: 'png' });
  await test.info().attach(name, { body: shot, contentType: 'image/png' });
  mkdirSync(SHOTS_DIR, { recursive: true });
  writeFileSync(path.join(SHOTS_DIR, `${name}.png`), shot);
}

test.describe('task 03 footer proof shots', () => {
  test('footer on / at 1440×900', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const footer = page.locator('footer[data-screen-label="Footer"]');
    await expect(footer).toBeVisible();
    // Pin the blocks a stale pre-redesign server cannot pass: the About
    // column with its "Contact the programme team" quirk, the Acknowledgement
    // and the last-updated row.
    await expect(footer.getByText('SCHOOLTEST', { exact: true })).toBeVisible();
    await expect(footer.getByText('About', { exact: true })).toBeVisible();
    await expect(
      footer.getByRole('link', { name: 'Contact the programme team' }),
    ).toBeVisible();
    await expect(footer.getByText(ACKNOWLEDGEMENT)).toBeVisible();
    await expect(footer.getByText(LAST_UPDATED)).toBeVisible();
    await expect(footer.getByText('© 2026 SchoolTest')).toBeVisible();
    await expect(footer.getByText('Piloting with founding schools')).toBeVisible();
    await shoot(footer, '03-landing-footer-1440x900');
  });

  test('footer on / at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto('/');
    const footer = page.locator('footer[data-screen-label="Footer"]');
    await expect(footer).toBeVisible();
    await expect(footer.getByText(ACKNOWLEDGEMENT)).toBeVisible();
    await shoot(footer, '03-landing-footer-375');
  });

  test('footer on /zh shows the locale-independent last-updated line', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/zh');
    const footer = page.locator('footer[data-screen-label="Footer"]');
    await expect(footer).toBeVisible();
    await expect(footer.getByText(ACKNOWLEDGEMENT)).toBeVisible();
    // The line is hardcoded English on the redesigned landing — it must NOT
    // come out translated or locale-reformatted.
    await expect(footer.getByText(LAST_UPDATED)).toBeVisible();
    await expect(footer.getByText(/页面最后更新于/)).toHaveCount(0);
    await shoot(footer, '03-zh-landing-last-updated');
  });
});
