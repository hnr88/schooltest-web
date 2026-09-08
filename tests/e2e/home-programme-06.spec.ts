import { resolve } from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { loadMessages } from './helpers/i18n';

// Task 06 proof tooling (mvp/landing-pages/tasks/06-home-programme.md ## Proof):
// renders the About band (#programme) and the five-row programme list on the
// real /eald page at 1440×900 and 375×900, prints and keeps the #programme
// anchor numbers, and saves the graded screenshots under
// mvp/landing-pages/proof/shots/ (also attached for the run report).
const en = loadMessages('en');
const SHOTS = resolve(process.cwd(), '../mvp/landing-pages/proof/shots');

const settle = async (page: Page): Promise<void> => {
  // ScrollReveal animates opacity/transform over 500ms once revealed.
  await page.waitForTimeout(600);
};

test.describe('task 06 — About band + five programme components', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('About band (#programme) renders pinned copy, badges, photo and fact table', async ({
    page,
  }, testInfo) => {
    await page.goto('/eald');
    const band = page.locator('section#programme');
    await band.scrollIntoViewIfNeeded();
    await settle(page);

    // Heading: the EXISTING problem.title through its unchanged t.rich call.
    await expect(band.locator('h2')).toHaveText(en['Eald.home.problem.title']);

    // The three pinned paragraphs (catalogue copy — 27 subskills stays).
    await expect(band).toContainText(en['Eald.home.problem.bodyOne']);
    await expect(band).toContainText(en['Eald.home.problem.bodyTwo']);
    await expect(band).toContainText(en['Eald.home.solution.body']);

    // Badge row: new lead-in + the three pinned badges.
    await expect(
      band.getByText(en['Eald.home.about.eyebrow'], { exact: true }),
    ).toHaveCount(1);
    await expect(
      band.getByText(en['Eald.home.problem.badgeScore'], { exact: true }),
    ).toHaveCount(1);
    await expect(
      band.getByText(en['Eald.home.problem.badgeCefr'], { exact: true }),
    ).toHaveCount(1);
    await expect(
      band.getByText(en['Eald.home.problem.badgePhase'], { exact: true }),
    ).toHaveCount(1);

    // Photo: real alt (content image, not decorative) + rendered figcaption.
    const img = band.locator('img');
    await expect(img).toHaveAttribute('alt', en['Eald.home.about.photoCaption']);
    await expect(band.locator('figcaption')).toHaveText(
      en['Eald.home.about.photoCaption'],
    );

    // Fact table: five cells in the design's order, Status value teal.
    const dts = band.locator('dl dt');
    const dds = band.locator('dl dd');
    await expect(dts).toHaveText([
      en['Eald.home.about.factCohortLabel'],
      en['Eald.home.about.factSkillsLabel'],
      en['Eald.home.about.factDeliveryLabel'],
      en['Eald.home.about.factReportingLabel'],
      en['Eald.home.about.factStatusLabel'],
    ]);
    await expect(dds).toHaveText([
      en['Eald.home.about.factCohortValue'],
      en['Eald.home.about.factSkillsValue'],
      en['Eald.home.about.factDeliveryValue'],
      en['Eald.home.about.factReportingValue'],
      en['Eald.home.about.factStatusValue'],
    ]);
    await expect(dds.nth(4)).toHaveClass(/text-teal-600/);

    const aboutShot = await band.screenshot({
      path: resolve(SHOTS, '06-home-about-1440.png'),
    });
    await testInfo.attach('06-home-about-1440', {
      body: aboutShot,
      contentType: 'image/png',
    });
  });

  test('five programme components: numbered rows, tiles, links, row 05 pill', async ({
    page,
  }, testInfo) => {
    await page.goto('/eald');
    // The breadcrumb is also an <ol> inside main — scope to the bordered card.
    const list = page.locator('main ol.bg-card');
    await list.scrollIntoViewIfNeeded();
    await settle(page);
    const section = page
      .locator('main section')
      .filter({ has: page.locator('ol.bg-card') })
      .first();

    // Header keeps the shipped catalogue eyebrow + title.
    await expect(
      section.getByText(en['Eald.home.whatYouGet.eyebrow'], { exact: true }),
    ).toHaveCount(1);
    await expect(
      section.getByRole('heading', { name: en['Eald.home.whatYouGet.title'] }),
    ).toBeVisible();

    const rows = list.locator('li');
    await expect(rows).toHaveCount(5);

    // Numbered tiles 01–05; tints 01–02 blue, 03–04 teal, 05 navy.
    const tileTexts = ['01', '02', '03', '04', '05'];
    for (const [i, tile] of tileTexts.entries()) {
      await expect(rows.nth(i).locator('span').first()).toHaveText(tile);
    }
    await expect(rows.nth(0).locator('span').first()).toHaveClass(/bg-blue-50/);
    await expect(rows.nth(1).locator('span').first()).toHaveClass(/bg-blue-50/);
    await expect(rows.nth(2).locator('span').first()).toHaveClass(/bg-teal-50/);
    await expect(rows.nth(3).locator('span').first()).toHaveClass(/bg-teal-50/);
    await expect(rows.nth(4).locator('span').first()).toHaveClass(/bg-navy-900/);

    // Rows 01–04 keep their existing hrefs; row 05 has NO anchor at all.
    const hrefs = [
      '/eald/diagnose',
      '/eald/teach',
      '/eald/track',
      '/eald/predict',
    ];
    for (const [i, href] of hrefs.entries()) {
      await expect(rows.nth(i).locator('a')).toHaveCount(1);
      await expect(rows.nth(i).locator('a')).toHaveAttribute('href', href);
      await expect(rows.nth(i).locator('a')).toContainText(
        en['Eald.shared.readMore'],
      );
    }
    await expect(rows.nth(4).locator('a')).toHaveCount(0);
    const pill = rows.nth(4).getByText(en['Eald.home.whatYouGet.inFieldTesting'], {
      exact: true,
    });
    await expect(pill).toHaveCount(1);

    // Hairlines between rows, none after the last.
    const borderBottom = (row: number) =>
      rows.nth(row).evaluate((el) => getComputedStyle(el).borderBottomWidth);
    for (const row of [0, 1, 2, 3]) {
      expect(await borderBottom(row)).toBe('1px');
    }
    expect(await borderBottom(4)).toBe('0px');

    const listShot = await section.screenshot({
      path: resolve(SHOTS, '06-home-what-you-get-1440.png'),
    });
    await testInfo.attach('06-home-what-you-get-1440', {
      body: listShot,
      contentType: 'image/png',
    });

    const row5Shot = await rows.nth(4).screenshot({
      path: resolve(SHOTS, '06-row05-pill.png'),
    });
    await testInfo.attach('06-row05-pill', {
      body: row5Shot,
      contentType: 'image/png',
    });
  });

  test('#programme anchor lands below the sticky header — measured numbers', async ({
    page,
  }, testInfo) => {
    await page.goto('/eald#programme');
    await settle(page);

    const numbers = await page.evaluate(() => {
      const header = document.querySelector('header');
      const h2 = document.querySelector('section#programme h2');
      const section = document.querySelector('section#programme');
      const headerBottom = header?.getBoundingClientRect().bottom ?? -1;
      const h2Top = h2?.getBoundingClientRect().top ?? -1;
      const scrollMarginTop = section
        ? getComputedStyle(section).scrollMarginTop
        : 'unknown';
      return { headerBottom, h2Top, scrollMarginTop };
    });
    console.log('[06 anchor numbers]', JSON.stringify(numbers));
    await testInfo.attach('06-anchor-numbers', {
      body: JSON.stringify(numbers, null, 2),
      contentType: 'application/json',
    });

    const shot = await page.screenshot({
      path: resolve(SHOTS, '06-programme-anchor.png'),
    });
    await testInfo.attach('06-programme-anchor', {
      body: shot,
      contentType: 'image/png',
    });

    expect(
      numbers.h2Top,
      `h2 top (${numbers.h2Top}) must clear the sticky header bottom (${numbers.headerBottom}); scrollMarginTop=${numbers.scrollMarginTop} — if this fails all three anchors are wrong together`,
    ).toBeGreaterThanOrEqual(numbers.headerBottom);
  });

  test.describe('mobile 375×900', () => {
    test.use({ viewport: { width: 375, height: 900 } });

    test('About band and programme list on mobile', async ({ page }, testInfo) => {
      await page.goto('/eald');
      const band = page.locator('section#programme');
      await band.scrollIntoViewIfNeeded();
      await settle(page);
      await expect(
        band.getByText(en['Eald.home.about.eyebrow'], { exact: true }),
      ).toHaveCount(1);
      const dds = band.locator('dl dd');
      await expect(dds).toHaveCount(5);
      const aboutShot = await band.screenshot({
        path: resolve(SHOTS, '06-home-about-375.png'),
      });
      await testInfo.attach('06-home-about-375', {
        body: aboutShot,
        contentType: 'image/png',
      });

      const list = page.locator('main ol.bg-card');
      await list.scrollIntoViewIfNeeded();
      await settle(page);
      await expect(list.locator('li')).toHaveCount(5);
      const listShot = await page
        .locator('main section')
        .filter({ has: page.locator('ol.bg-card') })
        .first()
        .screenshot({ path: resolve(SHOTS, '06-home-what-you-get-375.png') });
      await testInfo.attach('06-home-what-you-get-375', {
        body: listShot,
        contentType: 'image/png',
      });
    });
  });
});
