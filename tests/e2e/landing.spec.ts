import { expect, test } from '@playwright/test';

import {
  DE_SPOT_KEYS,
  FAQ_PAIRS,
  LANDING_TEXT_KEYS,
  LEAK_KEYS,
  assertFaqAnswers,
  escapeRegExp,
  expectAbsentTexts,
  expectVisibleTexts,
  heroTitleLines,
  home,
  homeAll,
  loadMessages,
  stripTags,
  type Locale,
  type Messages,
} from './helpers/i18n';

const FALLBACK_BASE_URL = 'http://localhost:3100';

// Assertions derive from the catalogs at runtime — no copy is duplicated into this spec.
const catalogs: Record<Locale, Messages> = { en: loadMessages('en'), de: loadMessages('de') };

test('EN render: every landing section renders from en.json', async ({ page }) => {
  const en = catalogs.en;
  await page.goto('/');

  // The root layout applies a "%s · Schooltest" template — match the catalog title inside it.
  await expect(page).toHaveTitle(new RegExp(escapeRegExp(home(en, 'meta.title'))));
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    home(en, 'meta.description'),
  );

  const h1 = page.locator('h1');
  for (const line of heroTitleLines(en)) {
    await expect(h1).toContainText(line);
  }
  await expect(
    page.getByRole('heading', { name: stripTags(home(en, 'flow.title')), exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('img', { name: home(en, 'hero.imageAlt'), exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: home(en, 'hero.primaryCta'), exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: home(en, 'hero.secondaryCta'), exact: true }),
  ).toBeVisible();

  await expectVisibleTexts(page, homeAll(en, LANDING_TEXT_KEYS));
  await expectVisibleTexts(page, [stripTags(home(en, 'featureDetail.card.suggestion'))]);
  await assertFaqAnswers(page, en, FAQ_PAIRS);
});

test('DE render: NEXT_LOCALE=de renders every section from de.json', async ({
  browser,
  baseURL,
}) => {
  const de = catalogs.de;
  const context = await browser.newContext({ baseURL });
  await context.addCookies([
    { name: 'NEXT_LOCALE', value: 'de', url: baseURL ?? FALLBACK_BASE_URL },
  ]);
  const page = await context.newPage();
  try {
    await page.goto('/');
    await expect(page).toHaveTitle(new RegExp(escapeRegExp(home(de, 'meta.title'))));
    const h1 = page.locator('h1');
    for (const line of heroTitleLines(de)) {
      await expect(h1).toContainText(line);
    }
    await expect(
      page.getByRole('heading', { name: stripTags(home(de, 'flow.title')), exact: true }),
    ).toBeVisible();
    await expectVisibleTexts(page, homeAll(de, DE_SPOT_KEYS));
    await assertFaqAnswers(page, de, FAQ_PAIRS.slice(1, 2));
  } finally {
    await context.close();
  }
});

test('no locale leaks: DE page shows no EN copy and vice versa', async ({
  page,
  browser,
  baseURL,
}) => {
  // No locale cookie on the default context → EN default.
  await page.goto('/');
  await expectVisibleTexts(page, homeAll(catalogs.en, LEAK_KEYS));
  await expectAbsentTexts(page, homeAll(catalogs.de, LEAK_KEYS));

  const context = await browser.newContext({ baseURL });
  await context.addCookies([
    { name: 'NEXT_LOCALE', value: 'de', url: baseURL ?? FALLBACK_BASE_URL },
  ]);
  const dePage = await context.newPage();
  try {
    await dePage.goto('/');
    await expectVisibleTexts(dePage, homeAll(catalogs.de, LEAK_KEYS));
    await expectAbsentTexts(dePage, homeAll(catalogs.en, LEAK_KEYS));
  } finally {
    await context.close();
  }
});

test('composition: section landmarks render once, in contract order, with one h1', async ({
  page,
}) => {
  await page.goto('/');
  // Uniqueness per section component. Landmark roles (not tag selectors) are used for
  // header/main/footer: the Next.js dev overlay can inject extra <footer>/<header> tags
  // that CSS locators match through shadow DOM — roles only see the real landmarks.
  await expect(page.getByRole('banner')).toHaveCount(1);
  await expect(page.getByRole('main')).toHaveCount(1);
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.getByRole('contentinfo')).toHaveCount(1);
  for (const id of ['#product', '#ai-feedback', '#for-schools', '#pricing', '#resources', '#cta']) {
    await expect(page.locator(id), id).toHaveCount(1);
  }
  // The hero section carries no id — the single h1 marks its place in the chain.
  // document.querySelector does not cross shadow roots, so this chain is overlay-immune.
  const chain = [
    '[data-slot=announcement-bar]',
    'header',
    'main#main-content',
    'h1',
    '[data-slot=trusted-by]',
    '#product',
    '#ai-feedback',
    '[data-slot=stats-band]',
    '#for-schools',
    '#pricing',
    '#resources',
    '#cta',
    'footer',
  ];
  const ordered = await page.evaluate((selectors) => {
    const elements = selectors.map((selector) => document.querySelector(selector));
    return elements.every((element, index) => {
      if (element === null) return false;
      if (index === 0) return true;
      const previous = elements[index - 1];
      if (previous === null || previous === undefined) return false;
      return (previous.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
    });
  }, chain);
  expect(ordered).toBe(true);
});

test('anchors: every in-page link resolves; header Pricing scrolls to #pricing', async ({
  page,
}) => {
  const en = catalogs.en;
  await page.goto('/');

  const hrefs = await page
    .locator('a[href^="#"]')
    .evaluateAll((anchors) =>
      [...new Set(anchors.map((anchor) => anchor.getAttribute('href') ?? ''))].filter(
        (href) => href.length > 1,
      ),
    );
  expect(hrefs.length).toBeGreaterThan(0);
  for (const href of hrefs) {
    await expect(page.locator(href), href).toBeAttached();
  }

  await page
    .locator('header nav')
    .getByRole('link', { name: home(en, 'nav.pricing'), exact: true })
    .click();
  await expect(page).toHaveURL(/#pricing$/);
  await expect(page.locator('#pricing')).toBeInViewport();
});
