import { expect, test } from '@playwright/test';

import { cat, loadMessages } from './helpers/i18n';

// Task 05 (landing-pages) PROOF TOOLING — same sanctioned shell-Playwright
// pattern as tasks 02/03/04 (decisions.md "## During implementation", tagged
// 05). Not a regression suite: it pins the task's Done-when bullets and
// renders the viewport-exact screenshots that mvp/landing-pages/proof/05.md
// cites (1440×900 desktop ×2, 375×900 mobile).

const SHOT_DIR = '../mvp/landing-pages/proof/shots';

const messages = loadMessages('en');
const EYEBROW = cat(messages, 'Eald.home.hero.eyebrow');
const HERO_TITLE = cat(messages, 'Eald.home.hero.title');
const HERO_SUBTITLE = cat(messages, 'Eald.home.hero.subtitle');
const PRIMARY_CTA = cat(messages, 'Eald.home.hero.primaryCta');
const SECONDARY_CTA = cat(messages, 'Eald.home.hero.secondaryCta');
const STATS_LABEL = cat(messages, 'Eald.home.hero.statsLabel');
const STAT_LABELS = [
  cat(messages, 'Eald.home.hero.stat1Label'),
  cat(messages, 'Eald.home.hero.stat2Label'),
  cat(messages, 'Eald.home.hero.stat3Label'),
  cat(messages, 'Eald.home.hero.stat4Label'),
];
const STAT_VALUES = [
  cat(messages, 'Eald.home.hero.stat1Value'),
  cat(messages, 'Eald.home.hero.stat2Value'),
  cat(messages, 'Eald.home.hero.stat3Value'),
  cat(messages, 'Eald.home.hero.stat4Value'),
];
const CRUMB_LABEL = cat(messages, 'Navigation.breadcrumbLabel');
// The card hero's LCP hint (DiagnoseHero and every centred hero still use it).
const CARD_SIZES = '(min-width: 1380px) 1320px, calc(100vw - 2.5rem)';

test('desktop hero: breadcrumb, eyebrow, h1, CTAs and the four-cell stat strip render inside the band on /eald', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/eald');

  // One h1, and it is the catalogue's hero title (D-02 — content stays).
  const h1 = page.getByRole('heading', { level: 1 });
  await expect(h1).toHaveCount(1);
  await expect(h1).toHaveText(HERO_TITLE);

  // The design's eyebrow is new content; the body line keeps the catalogue value.
  await expect(page.getByText(EYEBROW, { exact: true })).toBeVisible();
  await expect(page.getByText(HERO_SUBTITLE, { exact: true })).toBeVisible();

  // The breadcrumb renders exactly once (the standalone row above <main> is
  // gone) and INSIDE the hero band: same <section> as the h1, above it.
  const crumbNav = page.getByRole('navigation', { name: CRUMB_LABEL, exact: true });
  await expect(crumbNav).toHaveCount(1);
  const heroBand = page.locator('section').filter({ has: h1 }).filter({ has: crumbNav });
  await expect(heroBand).toHaveCount(1);
  const crumbY = (await crumbNav.boundingBox())?.y ?? -1;
  const h1Y = (await h1.boundingBox())?.y ?? -1;
  expect(crumbY, 'breadcrumb sits above the hero heading inside the band').toBeLessThan(h1Y);

  // Both CTAs keep their catalogue labels and the task's hrefs. Scoped to the
  // hero band: the header's own "Register interest" button (task 02 chrome)
  // shares the label, so a page-wide lookup is ambiguous by design.
  await expect(heroBand.getByRole('link', { name: PRIMARY_CTA, exact: true })).toHaveAttribute(
    'href',
    '#register',
  );
  await expect(heroBand.getByRole('link', { name: SECONDARY_CTA, exact: true })).toHaveAttribute(
    'href',
    '/eald/diagnose',
  );

  // The four-cell stat strip: the aria-labelled dl (Chromium exposes dl as
  // term/definition roles, not list, so target the data-slot + label attr),
  // every design label and value visible (stat1Value is the app's own 27 per
  // D-02, not the design's 25).
  const strip = page.locator('dl[data-slot="stat-strip"]');
  await expect(strip).toBeVisible();
  await expect(strip).toHaveAttribute('aria-label', STATS_LABEL);
  for (const [index, label] of STAT_LABELS.entries()) {
    const cell = strip.locator('div').filter({ hasText: label }).filter({ hasText: STAT_VALUES[index] });
    await expect(cell).toBeVisible();
  }

  // LCP: the hero photo is the full-bleed band's image with priority.
  await expect(page.locator('img[sizes="100vw"]')).toHaveCount(1);

  const shot = await page.screenshot({ path: `${SHOT_DIR}/05-eald-hero-1440.png` });
  await testInfo.attach('05-eald-hero-1440', { body: shot, contentType: 'image/png' });
});

test('desktop hero: /eald/diagnose still renders the centred card hero, unchanged by the variant', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/eald/diagnose');

  const h1 = page.getByRole('heading', { level: 1 });
  await expect(h1).toHaveCount(1);

  // The card hero's LCP hint is untouched on this page, and the full-bleed
  // variant's viewport-wide image does not exist here.
  await expect(page.locator(`img[sizes="${CARD_SIZES}"]`).first()).toBeVisible();
  await expect(page.locator('img[sizes="100vw"]')).toHaveCount(0);

  // No breadcrumb moved into a hero band here: the crumb row still sits above
  // <main> as it does on every page task 05 does not touch.
  const crumbNav = page.getByRole('navigation', { name: CRUMB_LABEL, exact: true });
  await expect(crumbNav).toHaveCount(1);
  const main = page.locator('main');
  const crumbY = (await crumbNav.boundingBox())?.y ?? -1;
  const mainY = (await main.boundingBox())?.y ?? -1;
  expect(crumbY, 'diagnose crumb row stays above main').toBeLessThan(mainY);

  const shot = await page.screenshot({ path: `${SHOT_DIR}/05-diagnose-hero-unchanged-1440.png` });
  await testInfo.attach('05-diagnose-hero-unchanged-1440', { body: shot, contentType: 'image/png' });
});

test('375px: the hero band, stat strip and field-testing strip do not push the page sideways on /eald', async ({
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

  // Field-testing strip: design row layout, placeholder in the wordmark slot.
  await expect(page.locator('[data-slot="pilot-evidence-placeholder"]')).toBeVisible();
  await expect(page.getByText(cat(messages, 'Eald.home.trustedBy.label'), { exact: true })).toBeVisible();

  const shot = await page.screenshot({ path: `${SHOT_DIR}/05-eald-mobile-375.png` });
  await testInfo.attach('05-eald-mobile-375', { body: shot, contentType: 'image/png' });
});
