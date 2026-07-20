import path from 'node:path';

import { expect, test, type Locator, type Page } from '@playwright/test';

import { loginAsParent } from './helpers/auth';
import { cat, loadMessages } from './helpers/i18n';

// Task 014: consolidated C-UI-SHELL regression (mission flow 8) against the
// REAL app — Next on :3100 in front of the live api on :5500, with the seeded
// parent driven through the real /sign-in form (loginAsParent). Labels always
// resolve live from the en catalog, never duplicated here; the axe leg of the
// same anchor lives in shell-a11y.spec.ts (split for the 200-line rule).
const en = loadMessages('en');
const SCREENSHOTS = path.resolve(process.cwd(), '.qa', 'screenshots');
const DESKTOP = { width: 1280, height: 800 };
const MOBILE = { width: 375, height: 812 };

// D-C18 nav model (hrefs are contract data quoted in the task). `missing: true`
// routes 404 today — they ship in W3/W6/W7/W9 and tasks 015-057 tighten those
// legs to content + moved-active-state assertions then. For them this spec
// asserts the exact landing URL + the root not-found rendering WITHOUT the
// layout guard bouncing to /sign-in, and skips content/active-state checks:
// the dashboard layout (and with it the sidebar) does not wrap unmatched URLs.
const NAV_MODEL = [
  { labelKey: 'Shell.nav.overview', href: '/dashboard', missing: false },
  { labelKey: 'Shell.nav.myChildren', href: '/dashboard/children', missing: false },
  // W7/038 collapsed the two standalone search legs (schoolSearch + agentSearch)
  // into ONE unified Search entry — /dashboard/search ships the C-UI-SEARCH-UNIFIED
  // screen, so this leg is no longer a 404.
  { labelKey: 'Shell.nav.search', href: '/dashboard/search', missing: false },
  // /dashboard/settings shipped in W3 (C-UI-AUTH-PAGES change-password page) —
  // no longer a 404 leg; its content assertions live in that task's own spec.
  { labelKey: 'Shell.nav.settings', href: '/dashboard/settings', missing: false },
] as const;

// The vendored primitive (ui/ read-only) renders the fixed shell sidebar as
// div[data-slot="sidebar"] — that element IS the contract's "aside"; the
// navigation landmark semantics come from the <nav> inside it. On mobile the
// same slot only exists inside the open Sheet.
function sidebar(page: Page): Locator {
  return page.locator('[data-slot="sidebar"]');
}

function navLink(page: Page, label: string): Locator {
  return sidebar(page).getByRole('link', { name: label, exact: true });
}

async function readToken(page: Page): Promise<string | null> {
  return page.evaluate(() => window.localStorage.getItem('app.auth.token'));
}

test.describe('shell — desktop (1280)', () => {
  test.use({ viewport: DESKTOP });

  test('sidebar: visible at 248px with the 4 catalog-labelled links, soft active overview', async ({
    page,
  }) => {
    await loginAsParent(page);
    const aside = sidebar(page);
    await expect(aside).toBeVisible();
    await expect(aside).toHaveCSS('width', '248px');
    const sidebarRgb = await aside.evaluate((element) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('2d canvas context unavailable');
      context.fillStyle = getComputedStyle(element).backgroundColor;
      context.fillRect(0, 0, 1, 1);
      return [...context.getImageData(0, 0, 1, 1).data.slice(0, 3)];
    });
    expect(Math.max(...sidebarRgb)).toBeLessThan(100);

    const links = aside.locator('nav a');
    await expect(links).toHaveCount(NAV_MODEL.length);
    for (const [index, item] of NAV_MODEL.entries()) {
      await expect(links.nth(index)).toHaveText(cat(en, item.labelKey));
      await expect(links.nth(index)).toHaveAttribute('href', item.href);
    }

    // C6 soft active: on /dashboard only the exact-match overview item is
    // active — data-active set, carrying the accent bg class and actually
    // painting a bg the idle items (transparent) don't.
    const overview = navLink(page, cat(en, 'Shell.nav.overview'));
    const idle = navLink(page, cat(en, 'Shell.nav.myChildren'));
    await expect(overview).toHaveAttribute('data-active', /.*/);
    await expect(overview).toHaveClass(/data-active:bg-sidebar-accent/);
    await expect(idle).not.toHaveAttribute('data-active', /.*/);
    const activeBg = await overview.evaluate((el) => getComputedStyle(el).backgroundColor);
    const idleBg = await idle.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(idleBg).toBe('rgba(0, 0, 0, 0)');
    expect(activeBg).not.toBe(idleBg);

    // D-UI-2 motion baseline: nav recolors transition (~200ms), never snap.
    const motion = await overview.evaluate((el) => {
      const style = getComputedStyle(el);
      return { property: style.transitionProperty, duration: style.transitionDuration };
    });
    expect(motion.property).toContain('background-color');
    expect(motion.duration).toContain('0.2s');

    await page.screenshot({ path: path.join(SCREENSHOTS, 'shell-desktop.png'), fullPage: true });
  });

  test('desktop navigation toggles to its branded icon rail and returns with Ctrl+B', async ({
    page,
  }) => {
    await loginAsParent(page);
    const aside = sidebar(page);
    const trigger = page.getByRole('button', {
      name: cat(en, 'Shell.topbar.toggleNav'),
      exact: true,
    });

    await expect(trigger).toBeVisible();
    await trigger.click();
    await expect(aside).toHaveCSS('width', '48px');
    await expect(aside.getByRole('img', { name: cat(en, 'Shell.sidebar.logoAlt') })).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOTS, 'shell-desktop-collapsed.png') });
    await expect(navLink(page, cat(en, 'Shell.nav.overview'))).toHaveAttribute(
      'aria-label',
      cat(en, 'Shell.nav.overview'),
    );

    await page.keyboard.press('Control+b');
    await expect(aside).toHaveCSS('width', '248px');
  });

  test('header left side shows the current breadcrumb and title', async ({ page }) => {
    await loginAsParent(page);
    await page.goto('/dashboard/children');

    const breadcrumb = page.getByRole('navigation', {
      name: cat(en, 'Shell.topbar.breadcrumbLabel'),
    });
    await expect(breadcrumb).toContainText(cat(en, 'Shell.topbar.dashboard'));
    await expect(breadcrumb).toContainText(cat(en, 'Shell.nav.myChildren'));
    await expect(page.locator('[data-slot="topbar-page-title"]')).toHaveText(
      cat(en, 'Shell.nav.myChildren'),
    );
  });

  test('each nav link lands on its contract URL; 404 routes never bounce the session', async ({
    page,
  }) => {
    await loginAsParent(page);
    for (const item of NAV_MODEL) {
      if (!item.missing) continue;
      await navLink(page, cat(en, item.labelKey)).click();
      await page.waitForURL(`**${item.href}`);
      expect(new URL(page.url()).pathname).toBe(item.href);
      // Root not-found renders (no route yet) and the layout guard does NOT
      // bounce the still-authed session back to /sign-in.
      await expect(
        page.getByRole('heading', { name: cat(en, 'Common.notFoundTitle'), exact: true }),
      ).toBeVisible();
      expect(await readToken(page)).not.toBeNull();
      await page.goto('/dashboard');
      await expect(navLink(page, cat(en, item.labelKey))).toBeVisible();
    }
    // Back on /dashboard the exact-match overview item is active again.
    await expect(navLink(page, cat(en, 'Shell.nav.overview'))).toHaveAttribute(
      'data-active',
      /.*/,
    );
  });

  test('user chip menu → Sign out lands on /sign-in with the token cleared', async ({ page }) => {
    await loginAsParent(page);
    expect(await readToken(page)).toMatch(/^eyJ/);
    await page
      .getByRole('button', { name: cat(en, 'Shell.topbar.userMenuLabel'), exact: true })
      .click();
    await expect(
      page.getByRole('menuitem', { name: cat(en, 'Shell.userMenu.settings'), exact: true }),
    ).toBeVisible();
    await page
      .getByRole('menuitem', { name: cat(en, 'Shell.userMenu.signOut'), exact: true })
      .click();
    await page.waitForURL('**/sign-in');
    expect(await readToken(page)).toBeNull();
  });
});

test.describe('shell — mobile (375, Sheet nav)', () => {
  test.use({ viewport: MOBILE });

  test('aside hidden, hamburger opens the Sheet with all 4 links, Escape closes it', async ({
    page,
  }) => {
    await loginAsParent(page);
    await expect(sidebar(page)).toBeHidden();
    const trigger = page.getByRole('button', {
      name: cat(en, 'Shell.topbar.toggleNav'),
      exact: true,
    });
    await expect(trigger).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOTS, 'shell-mobile.png') });

    await trigger.click();
    const sheet = page.getByRole('dialog');
    await expect(sheet).toBeVisible();
    for (const item of NAV_MODEL) {
      const link = sheet.getByRole('link', { name: cat(en, item.labelKey), exact: true });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute('href', item.href);
    }
    // Settle the Sheet's 200ms entrance fade so the canonical screenshot shows
    // the resting open state, not a mid-transition frame.
    await sheet.evaluate(async (el) => {
      await Promise.all(
        el.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => null)),
      );
    });
    await page.screenshot({ path: path.join(SCREENSHOTS, 'shell-mobile-sheet-open.png') });

    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();
  });
});
