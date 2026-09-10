import { resolve } from 'node:path';

import { expect, test } from '@playwright/test';

import { loadMessages } from './helpers/i18n';

// Task 04 proof tooling (mvp/landing-pages/tasks/04-shared-page-tail.md ## Proof):
// renders the shared page tail on the real product pages at 1440×900, asserts the
// design composition, and saves the graded screenshots under
// mvp/landing-pages/proof/shots/ (also attached for the run report).
const en = loadMessages('en');
const SHOTS = resolve(process.cwd(), '../mvp/landing-pages/proof/shots');

test.use({ viewport: { width: 1440, height: 900 } });

async function settle(page: import('@playwright/test').Page): Promise<void> {
  // ScrollReveal animates opacity/transform over 500ms once revealed.
  await page.waitForTimeout(600);
}

test('quote band, next-nav and register CTA band on /eald/diagnose', async ({
  page,
}, testInfo) => {
  await page.goto('/eald/diagnose');

  // Quote band: decorative next/image photo under the navy scrim, pull quote
  // (t.rich keeps its <br>) and the footer line beneath it.
  const quoteBand = page
    .locator('main section')
    .filter({ has: page.locator('blockquote') })
    .first();
  await quoteBand.scrollIntoViewIfNeeded();
  await settle(page);
  await expect(quoteBand.locator('img')).toHaveAttribute('alt', '');
  await expect(quoteBand.locator('blockquote p')).toContainText(
    'A subskill profile is a map.',
  );
  await expect(quoteBand.locator('blockquote footer')).toHaveText(
    en['Eald.home.classroom.subtext'],
  );
  const quoteShot = await quoteBand.screenshot({
    path: resolve(SHOTS, '04-diagnose-quote-band.png'),
  });
  await testInfo.attach('04-diagnose-quote-band', {
    body: quoteShot,
    contentType: 'image/png',
  });

  // Next-nav: design eyebrow + heading, one bordered card, three numbered rows
  // (badge 01–02 blue, 03–04 teal), hairlines between rows but not after the last.
  const nextNav = page.locator('main ol');
  await nextNav.scrollIntoViewIfNeeded();
  await settle(page);
  const navSection = page
    .locator('main section')
    .filter({ has: page.locator('ol') })
    .first();
  await expect(navSection.getByText(en['Eald.shared.nextEyebrow'])).toBeVisible();
  await expect(
    navSection.getByRole('heading', { name: en['Eald.shared.nextHeading'] }),
  ).toBeVisible();
  const rows = nextNav.locator('li');
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(0).locator('span')).toHaveText('02');
  await expect(rows.nth(0).locator('span')).toHaveClass(/bg-blue-50/);
  await expect(rows.nth(1).locator('span')).toHaveText('03');
  await expect(rows.nth(1).locator('span')).toHaveClass(/bg-teal-50/);
  await expect(rows.nth(2).locator('span')).toHaveClass(/bg-teal-50/);
  await expect(rows.nth(2).locator('span')).toHaveText('04');
  const borderBottom = (row: number) =>
    rows.nth(row).evaluate((el) => getComputedStyle(el).borderBottomWidth);
  expect(await borderBottom(0)).toBe('1px');
  expect(await borderBottom(1)).toBe('1px');
  expect(await borderBottom(2)).toBe('0px');
  const navShot = await navSection.screenshot({
    path: resolve(SHOTS, '04-diagnose-next-nav.png'),
  });
  await testInfo.attach('04-diagnose-next-nav', {
    body: navShot,
    contentType: 'image/png',
  });

  // Register CTA band: navy full-bleed, founding-schools eyebrow, heading, body,
  // primary button and the new Evidence base button.
  const ctaBand = page
    .locator('main section')
    .filter({ has: page.locator('a[href$="#evidence"]') })
    .first();
  await ctaBand.scrollIntoViewIfNeeded();
  await settle(page);
  await expect(
    ctaBand.getByText(en['Eald.home.register.foundingEyebrow'], {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    ctaBand.getByRole('heading', { name: en['Eald.shared.cta.title'] }),
  ).toBeVisible();
  await expect(ctaBand.getByText(en['Eald.shared.cta.body'])).toBeVisible();
  const primary = ctaBand.locator('a[href$="#register"]');
  await expect(primary).toHaveText(en['Eald.shared.cta.button']);
  const secondary = ctaBand.locator('a[href$="#evidence"]');
  await expect(secondary).toHaveText(en['Eald.shared.cta.secondary']);
  const ctaShot = await ctaBand.screenshot({
    path: resolve(SHOTS, '04-diagnose-cta-band.png'),
  });
  await testInfo.attach('04-diagnose-cta-band', {
    body: ctaShot,
    contentType: 'image/png',
  });
});

test('home-page quote band (ClassroomBand) on /eald', async ({ page }, testInfo) => {
  await page.goto('/eald');

  const classroomBand = page
    .locator('main section')
    .filter({ has: page.locator('blockquote') })
    .first();
  await classroomBand.scrollIntoViewIfNeeded();
  await settle(page);
  await expect(classroomBand.locator('img')).toHaveAttribute('alt', '');
  await expect(classroomBand.locator('blockquote p')).toHaveText(
    en['Eald.home.classroom.quote'],
  );
  await expect(classroomBand.locator('blockquote footer')).toHaveText(
    en['Eald.home.classroom.subtext'],
  );
  const homeShot = await classroomBand.screenshot({
    path: resolve(SHOTS, '04-home-classroom-band.png'),
  });
  await testInfo.attach('04-home-classroom-band', {
    body: homeShot,
    contentType: 'image/png',
  });
});
