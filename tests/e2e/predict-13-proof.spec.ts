import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { loadMessages } from './helpers/i18n';

const messages = loadMessages('en');
const t = (key: string) => messages[`Eald.${key}`];
const out = path.resolve(process.cwd(), '../mvp/landing-pages/proof/shots');

test('Predict page preserves readiness and shows numeric cohort comparison at desktop and mobile', async ({
  page,
}, testInfo) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  mkdirSync(out, { recursive: true });
  const capture = async (name: string) => {
    const body = await page.screenshot({ path: path.join(out, `${name}.png`) });
    await testInfo.attach(name, { body, contentType: 'image/png' });
  };
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const response = await page.goto('/predict');
  expect(response?.status()).toBe(200);
  await page.evaluate(() => document.fonts.ready);
  await page.locator('#predict-hero img').evaluate((img: HTMLImageElement) => img.decode());
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveText(t('predict.hero.title').replace(/<[^>]*>/g, ''));
  await expect(page.locator('#predict-hero [data-slot="stat-strip"] dd')).toHaveText([
    t('predict.hero.domainsValue'),
    t('predict.hero.termValue'),
  ]);
  await expect(page.locator('#predict-hero [data-slot="stat-strip"] dt')).toHaveText([
    t('predict.hero.domainsLabel'),
    t('predict.hero.termLabel'),
  ]);
  await expect(page.locator('#predict-hero img')).toHaveAttribute(
    'alt',
    t('diagnose.hero.imageAlt'),
  );
  await expect(page.locator('#predict-hero a').nth(0)).toHaveAttribute('href', '/#register');
  await expect(page.locator('#predict-hero a').nth(1)).toHaveAttribute('href', '/track');
  await expect(page.locator('#cohort-photo a')).toHaveAttribute('href', '/diagnose');
  for (const key of [
    'term1Value',
    'term3Value',
    'blockingTitle',
    'blockingVocabulary',
    'blockingWriting',
    'readinessFooter',
  ])
    await expect(
      page.locator('#individual').getByText(t(`predict.individual.${key}`), { exact: true }),
    ).toHaveCount(1);
  for (const key of ['cohortBadge', 'exitBadge'])
    await expect(
      page.locator('#cohort').getByText(t(`predict.cohort.${key}`), { exact: true }),
    ).toHaveCount(1);
  const order = await page
    .locator('main > section')
    .evaluateAll((ns) => ns.map((n) => ({ id: n.id, text: n.textContent.slice(0, 110) })));
  expect(order.slice(0, 4).map((n) => n.id)).toEqual([
    'predict-hero',
    'individual',
    'cohort',
    'cohort-photo',
  ]);
  expect(order).toHaveLength(7);
  console.log('SURFACE_ORDER', JSON.stringify(order));
  const fig = page.locator('#cohort figure');
  const bars = fig.locator('[data-slot="bar-chart"]');
  await expect(bars).toHaveAttribute('aria-label', t('predict.cohort.figureAriaLabel'));
  await expect(bars.locator(':scope > li')).toHaveCount(4);
  const heights = await bars.locator('[style]').evaluateAll((ns) => ns.map((n) => n.style.height));
  expect(heights).toEqual(['90%', '30%', '60%', '50%', '50%', '80%', '20%', '60%']);
  const cells = await bars.locator('.sr-only').allTextContents();
  expect(cells).toEqual([
    'Term 1 Under 40%: 9',
    'Term 3 Under 40%: 3',
    'Term 1 40–59%: 6',
    'Term 3 40–59%: 5',
    'Term 1 60–79%: 5',
    'Term 3 60–79%: 8',
    'Term 1 80%+: 2',
    'Term 3 80%+: 6',
  ]);
  const counts = cells.map((s) => Number(s.split(': ').at(-1)));
  const totals = [0, 1].map((i) => counts.filter((_, n) => n % 2 === i).reduce((a, b) => a + b, 0));
  expect(totals).toEqual([22, 22]);
  await expect(fig.getByText(t('predict.cohort.figureFootnote'), { exact: true })).toHaveCount(1);
  const ticks = await bars.evaluate((ul) =>
    [...(ul.previousElementSibling?.children ?? [])].map((n) => ({
      text: n.textContent,
      top: n.getBoundingClientRect().top + n.getBoundingClientRect().height / 2,
    })),
  );
  expect(ticks.map((t) => t.text)).toEqual(['10 students', '8', '6', '4', '2', '0']);
  const plot = await bars.locator('li > [aria-hidden="true"]').first().boundingBox();
  if (!plot) throw new Error('Missing plot box');
  expect(Math.abs(ticks[0].top - plot.y)).toBeLessThan(1);
  expect(Math.abs(ticks[5].top - plot.y - 140)).toBeLessThan(1);
  for (const label of ['Term 1', 'Term 3']) {
    const legend = await fig.getByText(label, { exact: true }).boundingBox();
    if (!legend) throw new Error('Missing legend box');
    expect(legend.y + legend.height).toBeLessThan(plot.y);
  }
  console.log(
    'READINESS_PAIR_AND_BLOCKERS',
    JSON.stringify([
      t('predict.individual.term1Value'),
      t('predict.individual.term3Value'),
      t('predict.individual.blockingVocabulary'),
      t('predict.individual.blockingWriting'),
    ]),
  );
  console.log(
    'COHORT_FIGURE',
    JSON.stringify({
      heights,
      cells,
      totals,
      ticks,
      plotHeight: plot.height,
      legendAbovePlot: true,
    }),
  );
  const frame = async (selector: string) =>
    page
      .locator(selector)
      .evaluate((el) =>
        window.scrollTo({
          top:
            scrollY +
            el.getBoundingClientRect().top -
            (document.querySelector('header')?.getBoundingClientRect().bottom ?? 0) -
            20,
          behavior: 'instant',
        }),
      );
  await capture('13-hero-1440');
  await frame('#predict-hero img');
  await capture('13-campus-1440');
  await frame('#individual');
  await capture('13-readiness-1440');
  await frame('#cohort');
  await capture('13-cohort-1440');
  await page.locator('#cohort-photo img').evaluate((img: HTMLImageElement) => img.decode());
  await frame('#cohort-photo');
  await capture('13-photo-band-1440');
  await page.setViewportSize({ width: 375, height: 900 });
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await capture('13-hero-375');
  const scroller = fig.locator('.overflow-x-auto').last();
  const scroll = await scroller.evaluate((n) => {
    n.scrollLeft = n.scrollWidth;
    return {
      client: n.clientWidth,
      scroll: n.scrollWidth,
      left: n.scrollLeft,
      body: document.body.scrollWidth,
      viewport: innerWidth,
    };
  });
  expect(scroll.body).toBe(375);
  expect(scroll.scroll).toBeGreaterThan(scroll.client);
  expect(scroll.left).toBeGreaterThan(0);
  await frame('#cohort figure');
  await capture('13-cohort-375');
  console.log('MOBILE_SCROLL', JSON.stringify(scroll));
  await frame('#individual [data-slot="data-panel"]');
  await capture('13-readiness-375');
  expect(errors).toEqual([]);
  console.log(
    'PREDICT_CAPTURE_PASS: 4surfaces+tail,1h1,2retainedstats,34/81readiness,2blockingchips,2cohortchips,8textvalues,22/22totals,10studentaxis,3rootCTAs,internal375scroll,0pageerrors',
  );
});
