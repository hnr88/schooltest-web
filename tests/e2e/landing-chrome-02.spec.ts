import { expect, test } from '@playwright/test';

import { cat, loadMessages } from './helpers/i18n';

// Task 02 (landing-pages) PROOF TOOLING — recorded in
// mvp/landing-pages/decisions.md under "## During implementation" (tagged 02).
// Not a regression suite: it pins the task's Done-when bullets and renders the
// viewport-exact screenshots that mvp/landing-pages/proof/02.md cites.

const SHOT_DIR = '../mvp/landing-pages/proof/shots';

const messages = loadMessages('en');
const NAV_LABEL = cat(messages, 'Eald.nav.label');
const UTILITY_TAGLINE = cat(messages, 'Eald.nav.utilityTagline');
const SEARCH_LABEL = cat(messages, 'Eald.nav.searchLabel');
const SEARCH_SUBMIT = cat(messages, 'Eald.nav.searchSubmit');
const SEARCH_TARGET = /\/dashboard\/search\?mode=schools/;

const primaryNav = (page: import('@playwright/test').Page) =>
  page.getByRole('navigation', { name: NAV_LABEL, exact: true });

test('desktop chrome: the bands and the search form render in order on /eald', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/eald');

  const utility = page.getByText(UTILITY_TAGLINE, { exact: true });
  await expect(utility).toBeVisible();
  const header = page.locator('header');
  await expect(header).toBeVisible();
  const main = page.locator('main');
  await expect(main).toBeVisible();

  // Design order: utility bar -> masthead -> notice -> <main>. With both
  // settings flags off the notice renders nothing at all (Done-when bullet).
  const utilityY = (await utility.boundingBox())?.y ?? -1;
  const headerY = (await header.boundingBox())?.y ?? -1;
  const mainY = (await main.boundingBox())?.y ?? -1;
  expect(utilityY, 'utility bar sits above the masthead').toBeLessThan(headerY);
  expect(headerY, 'masthead sits above the notice slot / main').toBeLessThan(mainY);
  await expect(
    page.locator('[data-slot="announcement-banner"], [data-slot="maintenance-banner"]'),
  ).toHaveCount(0);

  // Labelled role="search" form: label, magnifier input, submit button.
  const search = page.getByRole('search');
  await expect(search).toBeVisible();
  const input = page.getByLabel(SEARCH_LABEL, { exact: true });
  await expect(input).toBeVisible();
  const submit = page.getByRole('button', { name: SEARCH_SUBMIT, exact: true });
  await expect(submit).toBeVisible();

  // It submits with Enter and with the button (D-04 target). The dashboard
  // guard then redirects an anonymous visitor, so every leg re-enters /eald.
  await input.fill('science');
  await input.press('Enter');
  await page.waitForURL(SEARCH_TARGET);
  await page.goto('/eald');
  await page.getByLabel(SEARCH_LABEL, { exact: true }).fill('science');
  await submit.click();
  await page.waitForURL(SEARCH_TARGET);
  await page.goto('/eald');

  // Utility-bar and nav destinations keep their hrefs.
  await expect(
    page.getByRole('link', { name: cat(messages, 'Eald.nav.schoolSearch'), exact: true }).first(),
  ).toHaveAttribute('href', '/dashboard/search');
  await expect(
    page.getByRole('link', { name: cat(messages, 'Eald.nav.contact'), exact: true }),
  ).toHaveAttribute('href', '/eald#register');
  await expect(
    page.getByRole('link', { name: cat(messages, 'Eald.nav.signIn'), exact: true }).first(),
  ).toHaveAttribute('href', '/sign-in');
  await expect(
    page.getByRole('link', { name: cat(messages, 'Eald.nav.registerInterest'), exact: true }),
  ).toHaveAttribute('href', '/eald#register');

  const shot = await page.screenshot({ path: `${SHOT_DIR}/02-eald-desktop-1440.png` });
  await testInfo.attach('02-eald-desktop-1440', { body: shot, contentType: 'image/png' });
});

test('desktop chrome: aria-current marks the active page on /eald and /eald/teach', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/eald');

  const nav = primaryNav(page);
  await expect(nav).toBeVisible();
  await expect(nav.getByRole('link', { name: cat(messages, 'Eald.nav.overview'), exact: true }))
    .toHaveAttribute('aria-current', 'page');
  await expect(
    nav.getByRole('link', { name: cat(messages, 'Eald.nav.teach'), exact: true }),
  ).not.toHaveAttribute('aria-current');

  await page.goto('/eald/teach');
  const navTeach = primaryNav(page);
  await expect(navTeach.getByRole('link', { name: cat(messages, 'Eald.nav.teach'), exact: true }))
    .toHaveAttribute('aria-current', 'page');
  await expect(
    navTeach.getByRole('link', { name: cat(messages, 'Eald.nav.overview'), exact: true }),
  ).not.toHaveAttribute('aria-current');

  const shot = await page.screenshot({ path: `${SHOT_DIR}/02-eald-teach-desktop-1440.png` });
  await testInfo.attach('02-eald-teach-desktop-1440', { body: shot, contentType: 'image/png' });
});

test('375px: no sideways push and the mobile sheet carries the new entries', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto('/eald');

  await expect
    .poll(() =>
      page.evaluate(() =>
        Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
      ),
    )
    .toBeLessThanOrEqual(375);

  const shot = await page.screenshot({ path: `${SHOT_DIR}/02-eald-mobile-375.png` });
  await testInfo.attach('02-eald-mobile-375', { body: shot, contentType: 'image/png' });

  await page.getByRole('button', { name: cat(messages, 'Eald.nav.openMenu'), exact: true }).click();
  await expect(
    page.getByRole('link', { name: cat(messages, 'Eald.nav.overview'), exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: cat(messages, 'Eald.nav.evidence'), exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: cat(messages, 'Eald.nav.closeMenu'), exact: true })
    .click();
  await expect(
    page.getByRole('link', { name: cat(messages, 'Eald.nav.evidence'), exact: true }),
  ).toBeHidden();
});
