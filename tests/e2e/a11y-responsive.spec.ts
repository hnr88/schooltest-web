import path from 'node:path';

import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import { home, loadMessages, type Locale, type Messages } from './helpers/i18n';
import { collectSmallTargets, watchErrors } from './helpers/ui';

// Assertions derive from the catalogs at runtime — no copy is duplicated into this spec.
const catalogs: Record<Locale, Messages> = { en: loadMessages('en'), zh: loadMessages('zh') };
const SCREENSHOTS = path.resolve(process.cwd(), '.qa', 'screenshots');
const DESKTOP = { width: 1280, height: 800 };
const MOBILE = { width: 375, height: 812 };

/** Asserts zero serious/critical axe violations; moderate/minor are logged, not asserted. */
async function expectAxeClean(page: Page, label: string): Promise<void> {
  const results = await new AxeBuilder({ page }).analyze();
  const blockers = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  );
  const advisories = results.violations.filter(
    (violation) => violation.impact === 'moderate' || violation.impact === 'minor',
  );
  if (advisories.length > 0) {
    console.log(
      `[axe ${label}] moderate/minor:`,
      advisories
        .map((violation) => `${violation.impact}:${violation.id} ×${violation.nodes.length}`)
        .join(', '),
    );
  }
  expect(
    blockers.map(
      (violation) =>
        `${violation.impact}:${violation.id} → ${violation.nodes.map((node) => node.target).join(' | ')}`,
    ),
    label,
  ).toEqual([]);
}

/** Asserts no horizontal scrollbar at the current viewport. */
async function expectNoHorizontalScroll(page: Page, label: string): Promise<void> {
  const fits = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth + 1,
  );
  expect(fits, `${label}: scrollWidth exceeded innerWidth`).toBe(true);
}

test('AXE: / (en) has zero serious/critical violations', async ({ page }) => {
  const errors = watchErrors(page);
  await page.setViewportSize(DESKTOP);
  await page.goto('/');
  await expectAxeClean(page, '/ en');
  await page.screenshot({ path: path.join(SCREENSHOTS, 'landing-en-desktop.png'), fullPage: true });
  expect(errors, errors.join('\n')).toEqual([]);
});

test('AXE: /design-system has zero serious/critical violations', async ({ page }) => {
  const errors = watchErrors(page);
  await page.setViewportSize(DESKTOP);
  await page.goto('/design-system');
  await expectAxeClean(page, '/design-system');
  await page.screenshot({ path: path.join(SCREENSHOTS, 'ds-desktop.png'), fullPage: true });
  expect(errors, errors.join('\n')).toEqual([]);
});

test('AXE: /zh has zero serious/critical violations', async ({ page }) => {
  const errors = watchErrors(page);
  await page.setViewportSize(DESKTOP);
  await page.goto('/zh');
  await expect(page).toHaveURL((url) => url.pathname === '/zh');
  await expectAxeClean(page, '/zh');
  await page.screenshot({
    path: path.join(SCREENSHOTS, 'landing-zh-desktop.png'),
    fullPage: true,
  });
  await page.setViewportSize(MOBILE);
  await page.screenshot({
    path: path.join(SCREENSHOTS, 'landing-zh-mobile.png'),
    fullPage: true,
  });
  expect(errors, errors.join('\n')).toEqual([]);
});

test('RESPONSIVE: no horizontal scroll; landing touch targets ≥44px at 375/1280', async ({
  page,
}) => {
  const errors = watchErrors(page);
  for (const viewport of [MOBILE, DESKTOP]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.waitForLoadState('networkidle'); // let RSC hydration finish before screenshots
    await expectNoHorizontalScroll(page, `/ @ ${viewport.width}px`);
    const small = await collectSmallTargets(page);
    expect(small, `/ @ ${viewport.width}px undersized targets:\n${small.join('\n')}`).toEqual([]);
    if (viewport === MOBILE) {
      await page.screenshot({
        path: path.join(SCREENSHOTS, 'landing-en-mobile.png'),
        fullPage: true,
      });
    }
    await page.goto('/design-system');
    await page.waitForLoadState('networkidle'); // Playwright screenshots hide the caret via inline styles — must not race hydration
    await expectNoHorizontalScroll(page, `/design-system @ ${viewport.width}px`);
    // Showcase exhibits the full vendored size scale (h-7…h-9 buttons, size-4 checkboxes,
    // 18px switches) — law 11 forbids editing vendored ui and the DS spec asserts those
    // exact sizes, so gallery targets are documented here, not asserted (see D22).
    const dsSmall = await collectSmallTargets(page);
    if (dsSmall.length > 0) {
      console.log(
        `[targets /design-system @ ${viewport.width}px] ${dsSmall.length} undersized gallery exhibits:\n${dsSmall.join('\n')}`,
      );
    }
    if (viewport === MOBILE) {
      await page.screenshot({ path: path.join(SCREENSHOTS, 'ds-mobile.png'), fullPage: true });
    }
  }
  expect(errors, errors.join('\n')).toEqual([]);
});

test('KEYBOARD: skip link first, Escape closes mobile menu, header CTA shows focus ring', async ({
  page,
}) => {
  const errors = watchErrors(page);
  const en = catalogs.en;
  await page.setViewportSize(DESKTOP);
  await page.goto('/');

  // First Tab focuses the skip link; it becomes visible when focused.
  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('link', { name: home(en, 'skipToContent') });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeVisible();

  // Second Tab reaches the announcement link (DOM order), logo link tolerated.
  await page.keyboard.press('Tab');
  const activeName = await page.evaluate(() => {
    const el = document.activeElement;
    return el === null ? '' : (el.getAttribute('aria-label') ?? el.textContent ?? '').trim();
  });
  expect([home(en, 'announcement.link'), home(en, 'footer.logoAlt')]).toContain(activeName);

  // Tab on to the header "Start free" CTA, then assert a visible focus indicator
  // (:focus-visible outline or ring box-shadow).
  const cta = page
    .locator('header')
    .getByRole('link', { name: home(en, 'nav.startFree'), exact: true });
  for (
    let i = 0;
    i < 20 && !(await cta.evaluate((el) => el === document.activeElement).catch(() => false));
    i += 1
  ) {
    await page.keyboard.press('Tab');
  }
  await expect(cta).toBeFocused();
  const indicator = await cta.evaluate((el) => {
    const style = getComputedStyle(el);
    return {
      outlineWidth: style.outlineWidth,
      outlineStyle: style.outlineStyle,
      boxShadow: style.boxShadow,
    };
  });
  const hasOutline =
    Number.parseFloat(indicator.outlineWidth) > 0 && indicator.outlineStyle !== 'none';
  const hasRing = indicator.boxShadow !== 'none';
  expect(hasOutline || hasRing, JSON.stringify(indicator)).toBe(true);

  // Mobile menu: opens via the catalog-labelled trigger, Escape closes it.
  await page.setViewportSize(MOBILE);
  await page.goto('/');
  await page.getByRole('button', { name: home(en, 'nav.openMenu') }).click();
  const sheet = page.getByRole('dialog');
  await expect(sheet).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();
  expect(errors, errors.join('\n')).toEqual([]);
});
