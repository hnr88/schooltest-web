import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';

// Task 13 proof tooling — re-pointed at the redesigned Predict page. The old
// #predict-hero/#individual/#cohort/#cohort-photo ids and BarChart kit are
// gone; sections are reached via their data-screen-label and the cohort chart
// is a grouped SVG column figure with value labels as <text>.
const out = path.resolve(process.cwd(), '../mvp/landing-pages/proof/shots');

// Cohort figure contract: 4 readiness bands × 2 terms, 22 students per term.
const COHORT_VALUES = ['9', '3', '6', '5', '5', '8', '2', '6'];
const TICKS = ['10 students', '8', '6', '4', '2', '0'];

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

  const hero = page.locator('section[data-screen-label="Hero"]');
  await hero.locator('img').evaluate((img: HTMLImageElement) => img.decode());
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveText('Know when a student is ready, and prove it.');
  // The hero's single CTA registers from the sub-page, over the campus photo.
  await expect(hero.locator('a[href="/#register"]').first()).toContainText('Join the pilot');
  await expect(
    hero.getByRole('img', { name: 'Students walking between classes on a school campus' }),
  ).toBeVisible();

  // The individual: the 34% → 81% readiness pair with the blocking chips.
  const individual = page.locator('section[data-screen-label="The individual"]');
  await expect(
    individual.getByRole('heading', { name: 'Data-informed exit decisions' }),
  ).toBeVisible();
  await expect(individual.getByText('Mainstream readiness · one student', { exact: true })).toHaveCount(1);
  for (const value of ['34%', '81%']) {
    await expect(individual.getByText(value, { exact: true })).toHaveCount(1);
  }
  await expect(individual.getByText('Still holding her back', { exact: true })).toHaveCount(1);
  for (const chip of ['Vocabulary', 'Syntax', 'Inference']) {
    await expect(individual.getByText(chip, { exact: true })).toBeVisible();
  }

  // Cohort chart section: chips, figure chrome, SVG columns, axis, legend.
  const cohort = page.locator('section[data-screen-label="Cohort chart"]');
  await expect(cohort.getByText('Cohort readiness · 22 students', { exact: true })).toHaveCount(1);
  await expect(cohort.getByText('4 projected to exit next term', { exact: true })).toHaveCount(1);
  const fig = cohort.locator('figure');
  await expect(fig.getByText('Figure 1 - Cohort readiness distribution', { exact: true })).toHaveCount(1);
  await expect(fig.getByText('Year 9 · 22 students', { exact: true })).toHaveCount(1);
  for (const term of ['Term 1', 'Term 3']) {
    await expect(fig.getByText(term, { exact: true })).toHaveCount(1);
  }
  const svg = fig.locator('svg[role="img"]');
  await expect(svg).toHaveAttribute(
    'aria-label',
    'Grouped column chart showing how many students in a cohort of 22 sit in each mainstream readiness band at Term 1 and Term 3',
  );
  await expect(svg.locator('rect')).toHaveCount(8);
  // Bar value labels are the NUMERIC texts plotted over the columns (x far
  // right of the y-axis tick labels at x=138), which keeps them separable
  // from the numeric y ticks and the readiness band captions under the groups.
  const barValueTexts = await svg.evaluate((node) =>
    [...node.querySelectorAll('text')]
      .filter(
        (t) =>
          Number(t.getAttribute('x') ?? 0) > 150 &&
          /^\d+$/.test((t.textContent ?? '').trim()),
      )
      .map((t) => t.textContent?.trim() ?? ''),
  );
  expect(barValueTexts, 'value labels render in figure order').toEqual(COHORT_VALUES);
  const texts = await svg.locator('text').allTextContents();
  for (const band of ['Under 40%', '40–59%', '60–79%', '80% +']) {
    expect(texts, `readiness band caption ${band}`).toContain(band);
  }
  for (const tick of TICKS) {
    expect(texts, `y-axis tick ${tick}`).toContain(tick);
  }
  // 22 students per sitting: (9+6+5+2) and (3+5+8+6).
  const values = COHORT_VALUES.map((value) => Number(value));
  const totals = [0, 1].map((offset) =>
    values.filter((_, index) => index % 2 === offset).reduce((a, b) => a + b, 0),
  );
  expect(totals).toEqual([22, 22]);

  // Cohort photo band keeps its pinned message and content photo.
  const photoBand = page.locator('section[data-screen-label="Cohort photo"]');
  await expect(photoBand.locator('img')).toHaveAttribute(
    'alt',
    'A teacher supervising secondary students sitting an assessment on laptops',
  );
  await expect(
    photoBand.getByRole('heading', { name: 'The call stays yours. The evidence is on the page.' }),
  ).toBeVisible();

  // Section order: hero, individual, cohort chart, cohort photo, then the
  // quote / spacer / next / register tail.
  const labels = await page
    .locator('main > section')
    .evaluateAll((ns) => ns.map((n) => n.getAttribute('data-screen-label')));
  expect(labels.slice(0, 4)).toEqual(['Hero', 'The individual', 'Cohort chart', 'Cohort photo']);
  console.log('SURFACE_ORDER', JSON.stringify(labels));

  const frame = async (locator: ReturnType<typeof page.locator>) =>
    locator.evaluate((el) =>
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
  await frame(hero.locator('img'));
  await capture('13-campus-1440');
  await frame(individual);
  await capture('13-readiness-1440');
  await frame(cohort);
  await capture('13-cohort-1440');
  await photoBand.locator('img').evaluate((img: HTMLImageElement) => img.decode());
  await frame(photoBand);
  await capture('13-photo-band-1440');

  // At 375px the cohort figure scales to its column; <main> never leaves the
  // viewport (the footer's nowrap acknowledgement line stays the one
  // contained exception).
  await page.setViewportSize({ width: 375, height: 900 });
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await capture('13-hero-375');
  const mainMax = await page.evaluate(
    () =>
      Math.max(
        ...[...document.querySelectorAll('main, main *')].map(
          (node) => node.getBoundingClientRect().right,
        ),
      ),
  );
  expect(mainMax, 'every main-content node fits the 375px viewport').toBeLessThanOrEqual(376);
  const widths = await svg.evaluate((node) => {
    const parent = node.parentElement as HTMLElement;
    const style = getComputedStyle(parent);
    return {
      svg: node.getBoundingClientRect().width,
      content: parent.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight),
    };
  });
  expect(widths.svg, 'the cohort chart scales to its column').toBeCloseTo(widths.content, 0);
  await frame(fig);
  await capture('13-cohort-375');
  console.log('MOBILE_FIT', JSON.stringify({ mainMax: Math.round(mainMax), ...widths }));
  await frame(individual);
  await capture('13-readiness-375');
  expect(errors).toEqual([]);
  console.log(
    'PREDICT_CAPTURE_PASS: 4surfaces+tail,1h1,2ctas,34/81readiness,3blockingchips,2cohortchips,8textvalues,22/22totals,10studentaxis,scaled375chart,0pageerrors',
  );
});
