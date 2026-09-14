import { resolve } from 'node:path';

import { expect, test, type Page } from '@playwright/test';

// Task 06 proof tooling — re-pointed at the redesigned landing: the About band
// (#programme) keeps its copy, photo and fact table; the five programme
// components became an editorial RANKED LIST (ghost numerals 01–05, arrow
// chips) with a navy row-06 pilot band instead of the old tile grid.
const SHOTS = resolve(process.cwd(), '../mvp/landing-pages/proof/shots');

const settle = async (page: Page): Promise<void> => {
  // Font/image settle; the redesigned page animates nothing, but keep the
  // beat so scroll-anchored geometry below is measured on a quiet page.
  await page.waitForTimeout(300);
};

test.describe('task 06 — About band + ranked programme list', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('About band (#programme) renders pinned copy, bullets, photo and fact table', async ({
    page,
  }, testInfo) => {
    await page.goto('/');
    const band = page.locator('section#programme');
    await band.scrollIntoViewIfNeeded();
    await settle(page);

    // Heading + lead paragraph.
    await expect(band.locator('h2')).toHaveText('English is so much more than four scores');
    await expect(
      band.getByText(
        'Placement test scores tell you next to nothing about what a student can actually do.',
      ),
    ).toBeVisible();

    // The three pinned bullets (catalogue copy — 27 subskills stays).
    await expect(
      band.getByText("A CEFR or a stanine can't be taught to.", { exact: true }),
    ).toHaveCount(1);
    await expect(band.getByText('One score can mean very different things.', { exact: true })).toHaveCount(1);
    await expect(
      band.getByText('Placement tests require six more weeks to figure them out.', { exact: true }),
    ).toHaveCount(1);

    // Photo: real alt (content image, not decorative), inside the band's figure.
    await expect(
      band.getByRole('img', {
        name: 'A secondary student writing in a workbook beside a laptop during class',
      }),
    ).toBeVisible();

    // Fact table: five cells in the design's order; each cell carries a value
    // dd and a caption dd (10 dds total).
    const dts = band.locator('dl dt');
    const dds = band.locator('dl dd');
    await expect(dts).toHaveText([
      'Skills',
      'Subskills',
      'In-classroom',
      'Year levels',
      'ALIGNED TO',
    ]);
    await expect(dds).toHaveText([
      'All four skills',
      'Reading, listening, speaking, writing',
      '27 subskills',
      'The detail behind each score',
      '40 min per skill',
      'In class, whenever you choose to test',
      'Years 7–12',
      'Age-appropriate, Australian contexts',
      'ACARA',
      'Based on the EAL/D learning progressions',
    ]);

    const aboutShot = await band.screenshot({
      path: resolve(SHOTS, '06-home-about-1440.png'),
    });
    await testInfo.attach('06-home-about-1440', {
      body: aboutShot,
      contentType: 'image/png',
    });
  });

  test('component grid: five numbered cards with tags and "See how" pills, plus the navy row 06 pilot card', async ({
    page,
  }, testInfo) => {
    await page.goto('/');
    const section = page.locator('section#what-you-get');
    await section.scrollIntoViewIfNeeded();
    await settle(page);

    // Header keeps the eyebrow, the new heading and the intro paragraph.
    await expect(section.getByText('HOW IT WORKS', { exact: true })).toHaveCount(1);
    await expect(section.getByRole('heading', { name: 'A different type of English test' })).toBeVisible();
    await expect(
      section.getByText(
        'Delivered in-class whenever you want: diagnose every skill, personalize content, track growth, predict readiness, and report to families and leadership before the kettle boils.',
      ),
    ).toBeVisible();

    // Five programme cards (numeral badge 01–05, tag, title, "See how" pill).
    const cards = section.locator('a.st-gcard');
    await expect(cards).toHaveCount(6);

    const cards_ = [
      {
        num: '01',
        tag: 'Diagnose',
        title: 'Diagnose strengths and weaknesses',
        desc: 'Four macro skills and 27 subskills. The detail that used to take weeks of watching, visible on day one.',
        href: '/diagnose',
      },
      {
        num: '02',
        tag: 'Teach',
        title: 'Plan and teach',
        desc: 'Drag and drop diagnostic data into your favourite LLM. Personalization and differentiation is no longer a Sunday night job.',
        href: '/teach',
      },
      {
        num: '03',
        tag: 'Track',
        title: 'Track progress over time',
        desc: 'Retest whenever you want and watch them grow on the ACARA scale. Make empirical teaching decisions that truly move the needle.',
        href: '/track',
      },
      {
        num: '04',
        tag: 'Predict',
        title: 'Predict mainstream readiness',
        desc: 'One readiness indicator across all four skills, aligned to ACARA. Exit calls you can defend.',
        href: '/predict',
      },
      {
        num: '05',
        tag: 'Report',
        title: 'Report to leadership and families',
        desc: 'A profile a family can read and evidence leadership can trust. Keep everyone informed.',
        href: '#evidence',
      },
    ];
    for (const [i, card] of cards_.entries()) {
      const target = cards.nth(i);
      await expect(target).toHaveAttribute('href', card.href);
      await expect(target.getByText(card.num, { exact: true })).toBeVisible();
      await expect(target.getByText(card.tag, { exact: true })).toBeVisible();
      await expect(target.getByText(card.title)).toBeVisible();
      await expect(target.getByText(card.desc)).toBeVisible();
      await expect(target.locator('.st-gcard-link')).toHaveText(/See how/);
    }

    // Card 06: the navy pilot card — heading, body and the teal
    // "Join the pilot" pill pointing at #register.
    const card06 = section.locator('a.st-gcard-dark[href="#register"]');
    await expect(card06).toHaveCount(1);
    await expect(card06.getByText('06', { exact: true })).toBeVisible();
    await expect(card06.getByText('Bring SchoolTest to your school')).toBeVisible();
    await expect(card06.getByText('Pilot testing is open. Join the pilot now.')).toBeVisible();
    await expect(card06.getByText('Join the pilot', { exact: true }).last()).toBeVisible();

    const listShot = await section.screenshot({
      path: resolve(SHOTS, '06-home-what-you-get-1440.png'),
    });
    await testInfo.attach('06-home-what-you-get-1440', {
      body: listShot,
      contentType: 'image/png',
    });

    const row6Shot = await card06.screenshot({
      path: resolve(SHOTS, '06-row06-pilot-card.png'),
    });
    await testInfo.attach('06-row06-pilot-card', {
      body: row6Shot,
      contentType: 'image/png',
    });
  });

  test('#programme anchor lands below the sticky header — measured numbers', async ({
    page,
  }, testInfo) => {
    await page.goto('/#programme');
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

    test('About band and component grid on mobile', async ({ page }, testInfo) => {
      await page.goto('/');
      const band = page.locator('section#programme');
      await band.scrollIntoViewIfNeeded();
      await settle(page);
      await expect(band.locator('dl dt')).toHaveCount(5);
      const aboutShot = await band.screenshot({
        path: resolve(SHOTS, '06-home-about-375.png'),
      });
      await testInfo.attach('06-home-about-375', {
        body: aboutShot,
        contentType: 'image/png',
      });

      const section = page.locator('section#what-you-get');
      await section.scrollIntoViewIfNeeded();
      await settle(page);
      await expect(section.locator('a.st-gcard')).toHaveCount(6);
      const listShot = await section.screenshot({
        path: resolve(SHOTS, '06-home-what-you-get-375.png'),
      });
      await testInfo.attach('06-home-what-you-get-375', {
        body: listShot,
        contentType: 'image/png',
      });
    });
  });
});
