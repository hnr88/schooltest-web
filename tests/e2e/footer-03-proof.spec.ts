/**
 * Task 03 (landing-pages) proof tooling — re-pointed at the CMS footer.
 *
 * Every marketing page now renders the CMS Layout footer
 * (`footer[data-testid="cms-footer"]`); the design's static footer
 * (`footer[data-screen-label="Footer"]`) is only the fallback for a CMS outage.
 * Expected copy is read from the live layout endpoint, never duplicated here.
 * The CMS layout is authored in English, so /zh shows the same (en fallback) copy.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type Locator } from '@playwright/test';

const SHOTS_DIR = path.resolve(process.cwd(), '..', 'mvp', 'landing-pages', 'proof', 'shots');
const API = process.env.E2E_API_BASE_URL ?? 'http://127.0.0.1:5500';

interface Layout {
  footerNote: string | null;
  copyright: string | null;
  footerGroups: { title: string; links: { label: string; href: string }[] }[];
}

async function layout(): Promise<Layout> {
  const res = await fetch(`${API}/api/layout?locale=en`);
  if (!res.ok) throw new Error(`[e2e] GET /api/layout failed with ${res.status}`);
  return ((await res.json()) as { data: Layout }).data;
}

async function shoot(footer: Locator, name: string): Promise<void> {
  const shot = await footer.screenshot({ type: 'png' });
  await test.info().attach(name, { body: shot, contentType: 'image/png' });
  mkdirSync(SHOTS_DIR, { recursive: true });
  writeFileSync(path.join(SHOTS_DIR, `${name}.png`), shot);
}

async function expectCmsFooter(footer: Locator, expected: Layout): Promise<void> {
  await expect(footer).toBeVisible();
  for (const group of expected.footerGroups) {
    await expect(footer.getByRole('heading', { name: group.title, exact: true })).toBeVisible();
    for (const link of group.links) {
      await expect(footer.locator(`a[href$="${link.href}"]`).filter({ hasText: link.label })).toHaveCount(1);
    }
  }
  if (expected.footerNote) await expect(footer.getByText(expected.footerNote)).toBeVisible();
  if (expected.copyright) await expect(footer.getByText(expected.copyright)).toBeVisible();
}

test.describe('task 03 footer proof shots', () => {
  test('CMS footer on / at 1440×900', async ({ page }) => {
    const expected = await layout();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const footer = page.locator('footer[data-testid="cms-footer"]');
    await expectCmsFooter(footer, expected);
    await expect(page.locator('footer[data-screen-label="Footer"]')).toHaveCount(0);
    await shoot(footer, '03-landing-footer-1440x900');
  });

  test('CMS footer on / at 375px', async ({ page }) => {
    const expected = await layout();
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto('/');
    const footer = page.locator('footer[data-testid="cms-footer"]');
    await expectCmsFooter(footer, expected);
    await shoot(footer, '03-landing-footer-375');
  });

  test('CMS footer on every landing page and on /zh (English layout fallback)', async ({ page }) => {
    const expected = await layout();
    await page.setViewportSize({ width: 1440, height: 900 });
    for (const target of ['/diagnose', '/teach', '/track', '/predict', '/report', '/zh']) {
      await page.goto(target);
      await expectCmsFooter(page.locator('footer[data-testid="cms-footer"]'), expected);
    }
    await shoot(page.locator('footer[data-testid="cms-footer"]'), '03-zh-landing-footer');
  });
});
