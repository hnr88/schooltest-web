import { resolve } from 'node:path';

import { expect, test } from '@playwright/test';

// Task 04 proof tooling — re-pointed at the redesigned landing's shared page
// tail: the photo quote band, the numbered next-nav list, and the navy
// register CTA band on the real product pages at 1440×900.
const SHOTS = resolve(process.cwd(), '../mvp/landing-pages/proof/shots');

test.use({ viewport: { width: 1440, height: 900 } });

async function settle(page: import('@playwright/test').Page): Promise<void> {
  await page.waitForTimeout(300);
}

const quoteBand = (page: import('@playwright/test').Page) =>
  page
    .locator('main section')
    .filter({ has: page.locator('blockquote') })
    .first();

test('quote band, next-nav and register CTA band on /diagnose', async ({
  page,
}, testInfo) => {
  await page.goto('/diagnose');

  // Quote band: decorative photo under the navy scrim, pull quote and its
  // footer line beneath it.
  const quote = quoteBand(page);
  await quote.scrollIntoViewIfNeeded();
  await settle(page);
  await expect(quote.locator('img')).toHaveAttribute('alt', '');
  await expect(quote.locator('blockquote p')).toContainText(
    'A subskill profile is a map.',
  );
  await expect(quote.locator('blockquote footer')).toHaveText(
    '27 subskills · reading, listening, speaking and writing',
  );
  const quoteShot = await quote.screenshot({
    path: resolve(SHOTS, '04-diagnose-quote-band.png'),
  });
  await testInfo.attach('04-diagnose-quote-band', {
    body: quoteShot,
    contentType: 'image/png',
  });

  // Next-nav: eyebrow + heading, one bordered card, four numbered rows
  // (02–05 — the redesign added the Report row), one arrow link per row.
  const nextNav = page.locator('section[data-screen-label="Next"] ol');
  await nextNav.scrollIntoViewIfNeeded();
  await settle(page);
  const navSection = page.locator('section[data-screen-label="Next"]');
  await expect(navSection.getByText('After the diagnostic', { exact: true })).toBeVisible();
  await expect(
    navSection.getByRole('heading', { name: 'Where the profile goes next.' }),
  ).toBeVisible();
  const rows = nextNav.locator('li');
  await expect(rows).toHaveCount(4);
  await expect(rows.nth(0).locator('span').first()).toHaveText('02');
  await expect(rows.nth(1).locator('span').first()).toHaveText('03');
  await expect(rows.nth(2).locator('span').first()).toHaveText('04');
  await expect(rows.nth(3).locator('span').first()).toHaveText('05');
  const expected = [
    { href: '/teach', title: 'Plan and teach from the results' },
    { href: '/track', title: 'Track progress over time' },
    { href: '/predict', title: 'Predict mainstream readiness' },
    { href: '/report', title: 'Report to everyone who needs it' },
  ];
  for (const [i, row] of expected.entries()) {
    await expect(rows.nth(i).locator('a')).toHaveAttribute('href', row.href);
    await expect(rows.nth(i).getByText(row.title)).toBeVisible();
  }
  // Hairlines between rows, none after the last.
  const borderBottom = (row: number) =>
    rows.nth(row).evaluate((el) => getComputedStyle(el).borderBottomWidth);
  for (const row of [0, 1, 2]) {
    expect(await borderBottom(row)).toBe('1px');
  }
  expect(await borderBottom(3)).toBe('0px');
  const navShot = await navSection.screenshot({
    path: resolve(SHOTS, '04-diagnose-next-nav.png'),
  });
  await testInfo.attach('04-diagnose-next-nav', {
    body: navShot,
    contentType: 'image/png',
  });

  // Register CTA band: navy full-bleed, founding-schools eyebrow, heading,
  // body and the primary button.
  const ctaBand = page.locator('section[data-screen-label="Register"]');
  await ctaBand.scrollIntoViewIfNeeded();
  await settle(page);
  await expect(ctaBand.getByText('Founding schools', { exact: true })).toBeVisible();
  await expect(
    ctaBand.getByRole('heading', { name: 'We’re building this with founding schools.' }),
  ).toBeVisible();
  await expect(
    ctaBand.getByText(
      'Pilot testing in Term 4, 2026. Get early access, direct input into the report design, and founding terms at launch.',
    ),
  ).toBeVisible();
  const primary = ctaBand.locator('a[href$="/#register"]');
  await expect(primary).toHaveText(/Join the pilot/);
  const ctaShot = await ctaBand.screenshot({
    path: resolve(SHOTS, '04-diagnose-cta-band.png'),
  });
  await testInfo.attach('04-diagnose-cta-band', {
    body: ctaShot,
    contentType: 'image/png',
  });
});

test('teach register band keeps the secondary evidence-base link; home quote band holds', async ({
  page,
}, testInfo) => {
  // Teach's CTA band carries the extra "Evidence base" ghost button.
  await page.goto('/teach');
  const ctaBand = page.locator('section[data-screen-label="Register"]');
  await expect(ctaBand.locator('a[href$="/#register"]')).toHaveText(/Join the pilot/);
  const secondary = ctaBand.locator('a[href$="/#evidence"]');
  await expect(secondary).toHaveText('Evidence base');

  // Home quote band (ClassroomBand equivalent) keeps its pinned copy.
  await page.goto('/');
  const classroomBand = quoteBand(page);
  await classroomBand.scrollIntoViewIfNeeded();
  await settle(page);
  await expect(classroomBand.locator('img')).toHaveAttribute('alt', '');
  await expect(classroomBand.locator('blockquote p')).toHaveText(
    'Assessment stops being a summary and starts being a map.',
  );
  await expect(classroomBand.locator('blockquote footer')).toHaveText(
    'Years 7–12 · Reading, listening, speaking and writing + 27 subskills',
  );
  const homeShot = await classroomBand.screenshot({
    path: resolve(SHOTS, '04-home-classroom-band.png'),
  });
  await testInfo.attach('04-home-classroom-band', {
    body: homeShot,
    contentType: 'image/png',
  });
});
