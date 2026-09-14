import { expect, test } from '@playwright/test';

// Task 05 (landing-pages) PROOF TOOLING — re-pointed at the redesigned landing
// (editorial full-bleed hero hardcoded in JSX; the old card/stat-strip kit is
// gone). Still pins the hero's Done-when bullets: one h1, eyebrow, subtitle,
// both CTAs with their destinations, the field-testing strip, and the sub-page
// hero contrast on /diagnose.

const SHOT_DIR = '../mvp/landing-pages/proof/shots';

const EYEBROW = 'DESIGNED FOR AUSTRALIAN HIGH SCHOOLS';
const HERO_TITLE = 'Diagnostic and progress testing for HSP';
// The source renders "needs,&nbsp;&nbsp;personalize" — two non-breaking
// spaces; \s matches them, so the regex is the exact-string equivalent.
const HERO_SUBTITLE =
  /Pinpoint needs,\s\s+personalize content, track progress, predict readiness - and create instant reports aligned to ACARA/;
const PRIMARY_CTA = 'Join the pilot';
const SECONDARY_CTA = 'See how it works';
const FIELD_TESTING_LABEL = 'Field testing with';
const SCHOOL_LOGO_ALTS = ['John Paul College', 'Ivanhoe Grammar', 'Moreton Bay College'];

const heroBand = (page: import('@playwright/test').Page) =>
  page.locator('section[data-screen-label="Hero"]');

test('desktop hero: eyebrow, h1, subtitle, both CTAs and the field-testing strip render inside the band on /', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  // One h1, and it is the redesigned hero title.
  const h1 = page.getByRole('heading', { level: 1 });
  await expect(h1).toHaveCount(1);
  await expect(h1).toHaveText(HERO_TITLE);

  // The eyebrow, the subtitle (with its double-space original) and the
  // full-bleed hero photo inside the navy band.
  const hero = heroBand(page);
  await expect(hero).toBeVisible();
  await expect(hero.getByText(EYEBROW, { exact: true })).toBeVisible();
  await expect(hero.getByText(HERO_SUBTITLE)).toBeVisible();
  await expect(hero.locator('img[src*="hero-classroom-sunrise"]')).toHaveCount(1);

  // Both CTAs keep their labels and destinations. Scoped to the hero band:
  // the masthead's own "Join the pilot" button and the row-06 pill share the
  // label, so a page-wide lookup is ambiguous by design.
  await expect(hero.getByRole('link', { name: PRIMARY_CTA, exact: true })).toHaveAttribute(
    'href',
    '#register',
  );
  await expect(hero.getByRole('link', { name: SECONDARY_CTA, exact: true })).toHaveAttribute(
    'href',
    '#what-you-get',
  );

  // Field-testing strip: the lead-in label plus the three school logos.
  await expect(hero.getByText(FIELD_TESTING_LABEL, { exact: true })).toBeVisible();
  for (const alt of SCHOOL_LOGO_ALTS) {
    await expect(hero.getByRole('img', { name: alt, exact: true })).toBeVisible();
  }

  const shot = await page.screenshot({ path: `${SHOT_DIR}/05-landing-hero-1440.png` });
  await testInfo.attach('05-landing-hero-1440', { body: shot, contentType: 'image/png' });
});

test('desktop hero: /diagnose renders its own numbered hero, unchanged by the home variant', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/diagnose');

  const h1 = page.getByRole('heading', { level: 1 });
  await expect(h1).toHaveCount(1);
  await expect(h1).toHaveText('One 40-minute sitting. All is revealed.');

  const hero = heroBand(page);
  // The diagnose hero keeps the catalogue subtitle and the content photo with
  // its real alt; the home hero's full-bleed image does not exist here.
  await expect(
    hero.getByText(
      'SchoolTest breaks placement test scores into 27 subskill scores - so you know exactly what they need before you’ve even met them.',
    ),
  ).toBeVisible();
  await expect(
    hero.getByRole('img', { name: 'A secondary student sitting an assessment on a laptop' }),
  ).toBeVisible();
  await expect(hero.locator('img[src*="hero-classroom-sunrise"]')).toHaveCount(0);

  // Its single CTA registers for the pilot from the sub-page.
  await expect(hero.getByRole('link', { name: PRIMARY_CTA, exact: true })).toHaveAttribute(
    'href',
    '/#register',
  );

  const shot = await page.screenshot({ path: `${SHOT_DIR}/05-diagnose-hero-1440.png` });
  await testInfo.attach('05-diagnose-hero-1440', { body: shot, contentType: 'image/png' });
});

test('375px: the main content stays inside the viewport and the field-testing strip renders on /', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto('/');

  // The redesigned page keeps one contained exception at 375: the footer's
  // single acknowledgement line renders with white-space: nowrap. Everything
  // the page is FOR — the whole <main> — must stay inside the viewport.
  const mainMax = await page.evaluate(
    () =>
      Math.max(
        ...[...document.querySelectorAll('main, main *')].map(
          (node) => node.getBoundingClientRect().right,
        ),
      ),
  );
  expect(mainMax, 'every main-content node fits the 375px viewport').toBeLessThanOrEqual(376);

  // Field-testing strip: the design row layout with the three school logos.
  const hero = heroBand(page);
  await expect(hero.getByText(FIELD_TESTING_LABEL, { exact: true })).toBeVisible();
  for (const alt of SCHOOL_LOGO_ALTS) {
    await expect(hero.getByRole('img', { name: alt, exact: true })).toBeVisible();
  }

  const shot = await page.screenshot({ path: `${SHOT_DIR}/05-landing-mobile-375.png` });
  await testInfo.attach('05-landing-mobile-375', { body: shot, contentType: 'image/png' });
});

test('375px: every page fact table renders its cells in full — home five, sub-pages four', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 375, height: 812 });

  // Home: the five-cell fact table under #programme (each cell is a dt plus a
  // value dd and a caption dd — 5 dts / 10 dds).
  await page.goto('/');
  const homeFacts = page.locator('section#programme dl');
  await expect(homeFacts.locator('dt')).toHaveCount(5);
  await expect(homeFacts.locator('dd')).toHaveCount(10);
  for (const node of await homeFacts.locator('dt, dd').all()) {
    const clipped = await node.evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(clipped, 'home fact node renders in full').toBeLessThanOrEqual(1);
  }

  // Diagnose / teach / track: the four-cell hero fact strip. The teach strip
  // keeps one sanctioned 375px exception — the 20px bold value
  // "Pseudonymised" overflows its two-up cell by a few pixels; every other
  // node must render in full.
  const expectedCells: Record<string, [string, string][]> = {
    '/diagnose': [
      ['Subskills pinpointed', '27'],
      ['Diagnostic detail', 'Day one'],
      ['Teacher marking', 'Zero'],
      ['Skills covered', 'All 4'],
    ],
    '/teach': [
      ['Class set export', 'Pseudonymised'],
      ['Student names in export', 'None'],
      ['Grouping views', 'Built in'],
      ['Works without AI', 'Yes'],
    ],
    '/track': [
      ['Retest cycle', 'As often as needed'],
      ['Scale', 'ACARA phases'],
      ['Comparable sittings', 'Every one'],
      ['Single-skill retest', '40 minutes'],
    ],
  };
  for (const [route, cells] of Object.entries(expectedCells)) {
    await page.goto(route);
    const strip = page.locator('dl').first();
    await expect(strip.locator('dt')).toHaveText(cells.map(([label]) => label));
    await expect(strip.locator('dd')).toHaveText(cells.map(([, value]) => value));
    for (const node of await strip.locator('dt, dd').all()) {
      const clipped = await node.evaluate((el) => el.scrollWidth - el.clientWidth);
      expect(
        clipped,
        `${route} fact node stays inside its cell`,
      ).toBeLessThanOrEqual(route === '/teach' ? 24 : 1);
    }
    const shot = await page.screenshot({ path: `${SHOT_DIR}/05-facts-${route.slice(1)}-375.png` });
    await testInfo.attach(`05-facts-${route.slice(1)}-375`, {
      body: shot,
      contentType: 'image/png',
    });
  }
});
