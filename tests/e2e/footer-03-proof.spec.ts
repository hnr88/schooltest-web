/**
 * Task 03 (landing-pages) proof tooling — NOT a regression suite.
 *
 * Renders the three viewport-exact shots the task's Proof block asks for:
 * the redesigned footer on /eald at 1440×900 and 375px, and /zh/eald showing
 * the locale-formatted "Page last updated" date. Behavioural footer coverage
 * stays with the existing e2e suites (legal.spec, eald-journey, landing-aria).
 *
 * Operator e2e directive + its shell-Playwright correction; declared in
 * decisions.md ## During implementation. Each shot is attached via
 * testInfo.attach AND written under mvp/landing-pages/proof/shots/ so the
 * proof block's paths exist.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type Locator } from '@playwright/test';

import { loadMessages } from './helpers/i18n';

const SHOTS_DIR = path.resolve(process.cwd(), '..', 'mvp', 'landing-pages', 'proof', 'shots');

const en = loadMessages('en');
const zh = loadMessages('zh');

async function shoot(footer: Locator, name: string): Promise<void> {
  const shot = await footer.screenshot({ type: 'png' });
  await test.info().attach(name, { body: shot, contentType: 'image/png' });
  mkdirSync(SHOTS_DIR, { recursive: true });
  writeFileSync(path.join(SHOTS_DIR, `${name}.png`), shot);
}

test.describe('task 03 footer proof shots', () => {
  test('footer on /eald at 1440×900', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/eald');
    const footer = page.locator('footer.bg-navy-900'); // task 02's utility bar ships its own <footer>
    await expect(footer).toBeVisible();
    // Pin the new blocks so a stale pre-task server cannot pass: the proof
    // shots must show the Acknowledgement and the last-updated row.
    await expect(footer.getByText(en['Eald.footer.acknowledgement'])).toBeVisible();
    await expect(footer.getByText(en['Eald.footer.forSchoolsTitle'])).toBeVisible();
    await expect(footer.getByText(/Page last updated/)).toBeVisible();
    await shoot(footer, '03-eald-footer-1440x900');
  });

  test('footer on /eald at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto('/eald');
    const footer = page.locator('footer.bg-navy-900'); // task 02's utility bar ships its own <footer>
    await expect(footer).toBeVisible();
    await expect(footer.getByText(en['Eald.footer.acknowledgement'])).toBeVisible();
    await shoot(footer, '03-eald-footer-375');
  });

  test('footer on /zh/eald shows the localised last-updated date', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/zh/eald');
    const footer = page.locator('footer.bg-navy-900'); // task 02's utility bar ships its own <footer>
    await expect(footer).toBeVisible();
    await expect(footer.getByText(zh['Eald.footer.acknowledgement'])).toBeVisible();
    await expect(footer.getByText(/页面最后更新于/)).toBeVisible();
    // The locale-formatted value itself (zh long date, UTC) — the copyright
    // line also carries 2026, so match the whole last-updated string.
    await expect(footer.getByText(/页面最后更新于 2026年8月31日/)).toBeVisible();
    await shoot(footer, '03-zh-eald-last-updated');
  });
});
