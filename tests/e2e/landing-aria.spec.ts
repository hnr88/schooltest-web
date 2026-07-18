import { expect, test } from '@playwright/test';

import { home, icu, loadMessages, type Locale, type Messages } from './helpers/i18n';

// Aria-label catalog keys are proven rendered, not just present in the JSONs (C-E2E-1).
const catalogs: Record<Locale, Messages> = { en: loadMessages('en'), de: loadMessages('de') };

test('aria labels: nav landmark, socials, rating, score bars render from en.json', async ({
  page,
}) => {
  const en = catalogs.en;
  await page.goto('/');

  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    home(en, 'meta.description'),
  );
  await expect(
    page.getByRole('navigation', { name: home(en, 'nav.label'), exact: true }),
  ).toHaveCount(1);
  for (const key of ['footer.socialX', 'footer.socialYouTube', 'footer.socialLinkedIn']) {
    await expect(page.getByRole('link', { name: home(en, key), exact: true })).toBeVisible();
  }
  await expect(
    page.getByRole('img', { name: home(en, 'testimonial.ratingLabel'), exact: true }),
  ).toBeVisible();
  const scoreRows: [string, string][] = [
    ['featureDetail.card.grammar', 'featureDetail.card.scoreGrammar'],
    ['featureDetail.card.vocabulary', 'featureDetail.card.scoreVocabulary'],
    ['featureDetail.card.coherence', 'featureDetail.card.scoreCoherence'],
  ];
  for (const [skillKey, scoreKey] of scoreRows) {
    const name = icu(home(en, 'featureDetail.card.scoreLabel'), {
      skill: home(en, skillKey),
      score: home(en, scoreKey),
    });
    await expect(page.getByRole('progressbar', { name, exact: true })).toBeVisible();
  }
});

test('aria labels: German catalog values render in de mode', async ({ browser, baseURL }) => {
  const de = catalogs.de;
  const context = await browser.newContext({ baseURL });
  await context.addCookies([
    { name: 'NEXT_LOCALE', value: 'de', url: baseURL ?? 'http://localhost:3100' },
  ]);
  const page = await context.newPage();
  try {
    await page.goto('/');
    await expect(
      page.getByRole('navigation', { name: home(de, 'nav.label'), exact: true }),
    ).toHaveCount(1);
    await expect(
      page.getByRole('img', { name: home(de, 'testimonial.ratingLabel'), exact: true }),
    ).toBeVisible();
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      home(de, 'meta.description'),
    );
    for (const key of ['footer.socialX', 'footer.socialYouTube', 'footer.socialLinkedIn']) {
      await expect(page.getByRole('link', { name: home(de, key), exact: true })).toBeVisible();
    }
    const name = icu(home(de, 'featureDetail.card.scoreLabel'), {
      skill: home(de, 'featureDetail.card.grammar'),
      score: home(de, 'featureDetail.card.scoreGrammar'),
    });
    await expect(page.getByRole('progressbar', { name, exact: true })).toBeVisible();
  } finally {
    await context.close();
  }
});
