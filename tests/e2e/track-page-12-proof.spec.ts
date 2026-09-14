/**
 * Task 12 (landing-pages) proof tooling — re-pointed at the redesigned Track
 * page. The dark hero, the Reading evidence card (Term 1–4 phase trail), and
 * the four-series grouped SVG column figure at 1440×900; the 1024px legibility
 * check; and the 375px in-viewport check. The old BarChart kit with sr-only
 * value cells is gone — values are now <text> labels on the SVG columns.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test } from '@playwright/test';

const SHOTS_DIR = path.resolve(process.cwd(), '..', 'mvp', 'landing-pages', 'proof', 'shots');

// The figure's pinned data contract: 4 categories × 4 terms, values as text
// labels above the columns, ACARA phase labels on the y axis.
const VALUES = [
  ['24', '42', '66', '84'], // Vocabulary
  ['18', '30', '52', '72'], // Inference
  ['36', '44', '58', '68'], // Grammar
  ['16', '20', '26', '34'], // Critical reading
];
const CATEGORIES = ['Vocabulary', 'Inference', 'Grammar', 'Critical'];
const TERMS = ['Term 1', 'Term 2', 'Term 3', 'Term 4'];
const BANDS = ['Independent', 'Consolidating', 'Developing', 'Emerging', 'Beginning'];
const ALL_VALUES = VALUES.flat();

test.describe('task 12 track page proof shots', () => {
  test('dark hero, evidence card and four-series figure at 1440×900', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/track');

    // Dark full-bleed hero with its four-cell fact strip and CTA.
    const hero = page.locator('section[data-screen-label="Hero"]');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Watch every subskill move every time you test.',
    );
    await expect(hero.locator('dl dd')).toHaveCount(4);
    await expect(hero.locator('a[href="/#register"]').first()).toContainText('Join the pilot');

    // Evidence card: chip + the four ordered TERM rows. Scoped to the card —
    // its phase strings also render as chart band labels. Term 4 sits on the
    // navy row by design.
    const evidenceCard = page
      .locator('section[data-screen-label="Evidence trail"] div')
      .filter({ has: page.getByText('CONSOLIDATING', { exact: true }) })
      .filter({ has: page.getByText('Term 4', { exact: true }) })
      .first();
    await expect(evidenceCard.getByText('Reading', { exact: true })).toBeVisible();
    for (const [term, phase] of [
      ['Term 1', 'Emerging'],
      ['Term 2', 'Emerging'],
      ['Term 3', 'Developing'],
      ['Term 4', 'Consolidating'],
    ] as const) {
      const row = evidenceCard.locator('li').filter({ hasText: term });
      await expect(row, `${term} row`).toContainText(phase);
    }

    // Figure chrome: caption + the four-series legend.
    const figure = page.locator('section[data-screen-label="Progress chart"] figure');
    await expect(figure).toBeVisible();
    await expect(figure.getByText('Class level progress', { exact: true })).toBeVisible();
    for (const term of TERMS) {
      await expect(figure.getByText(term, { exact: true })).toHaveCount(1);
    }

    // The SVG chart: aria-labelled, 16 grouped <rect> columns, every value
    // exposed as text, ACARA band labels on the y axis.
    const svg = figure.locator('svg[role="img"]');
    await expect(svg).toHaveAttribute(
      'aria-label',
      'Grouped column chart showing four reading subskills measured across four school terms',
    );
    const rects = svg.locator('rect');
    await expect(rects).toHaveCount(16);
    const texts = await svg.locator('text').allTextContents();
    for (const value of ALL_VALUES) {
      expect(texts, `value label ${value} renders as text`).toContain(value);
    }
    expect(texts.filter((text) => ALL_VALUES.includes(text)), 'values render ranked').toEqual(
      ALL_VALUES,
    );
    for (const band of BANDS) {
      expect(texts, `y-axis band label ${band}`).toContain(band);
    }
    for (const category of CATEGORIES) {
      expect(texts, `x-axis category label ${category}`).toContain(category);
    }

    const shot = await page.screenshot({ type: 'png', fullPage: true });
    mkdirSync(SHOTS_DIR, { recursive: true });
    writeFileSync(path.join(SHOTS_DIR, '12-track-1440x900-full.png'), shot);
  });

  test('four-series legend and columns stay legible at 1024px', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.goto('/track');

    const figure = page.locator('section[data-screen-label="Progress chart"] figure');
    await expect(figure).toBeVisible();
    for (const term of TERMS) {
      await expect(figure.getByText(term, { exact: true })).toBeVisible();
    }
    const svg = figure.locator('svg[role="img"]');
    await expect(svg).toBeVisible();
    const texts = await svg.locator('text').allTextContents();
    for (const category of CATEGORIES) {
      expect(texts, `x-axis category label ${category} stays rendered`).toContain(category);
    }
    await expect(svg.locator('rect')).toHaveCount(16);

    const shot = await page.screenshot({ type: 'png', fullPage: true });
    mkdirSync(SHOTS_DIR, { recursive: true });
    writeFileSync(path.join(SHOTS_DIR, '12-track-1024-legend.png'), shot);
  });

  test('375px: main content (figure included) stays inside the viewport', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto('/track');

    // The redesigned page keeps one contained 375px exception — the footer's
    // nowrap acknowledgement line. Everything in <main> must fit.
    const mainMax = await page.evaluate(
      () =>
        Math.max(
          ...[...document.querySelectorAll('main, main *')].map(
            (node) => node.getBoundingClientRect().right,
          ),
        ),
    );
    expect(mainMax, 'every main-content node fits the 375px viewport').toBeLessThanOrEqual(376);

    const figure = page.locator('section[data-screen-label="Progress chart"] figure');
    await expect(figure).toBeVisible();
    const svg = figure.locator('svg[role="img"]');
    await expect(svg).toBeVisible();
    const widths = await svg.evaluate((node) => {
      const parent = node.parentElement as HTMLElement;
      const style = getComputedStyle(parent);
      return {
        svg: node.getBoundingClientRect().width,
        content:
          parent.clientWidth -
          parseFloat(style.paddingLeft) -
          parseFloat(style.paddingRight),
      };
    });
    expect(widths.svg, 'the chart scales to its column').toBeCloseTo(widths.content, 0);
    await expect(svg.locator('rect')).toHaveCount(16);

    const shot = await page.screenshot({ type: 'png', fullPage: true });
    mkdirSync(SHOTS_DIR, { recursive: true });
    writeFileSync(path.join(SHOTS_DIR, '12-track-375-full.png'), shot);
  });
});
