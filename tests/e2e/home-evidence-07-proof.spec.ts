/**
 * Task 07 (landing-pages) proof tooling — re-pointed at the redesigned home.
 *
 * The #evidence band's figure is now a VERTICAL AI-benchmark-style column
 * chart rendered as inline SVG (<rect> columns, value labels as <text>, phase
 * captions, y gridlines) with the caption "READING: Score 58 / CEFR B1" and
 * the "SUBSKILL PROFILE" chip. The old horizontal BarChart kit, its legend and
 * its sr-only value cells are gone. Renders the proof artefacts at 1440×900
 * and 375px, plus the six-locale render of the (locale-independent) figure.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test } from '@playwright/test';

const SHOTS_DIR = path.resolve(process.cwd(), '..', 'mvp', 'landing-pages', 'proof', 'shots');
const LOCALES = ['en', 'zh', 'ko', 'ms', 'vi', 'th'] as const;

// The figure's pinned data contract: ranked columns, value labels, ACARA
// phase captions. Decoding (72) is the accent-blue lead column.
const COLUMNS = [
  { value: '72', phase: 'CONSOLIDATING' },
  { value: '58', phase: 'DEVELOPING' },
  { value: '52', phase: 'DEVELOPING' },
  { value: '32', phase: 'EMERGING' },
  { value: '27', phase: 'EMERGING' },
  { value: '14', phase: 'BEGINNING' },
  { value: '10', phase: 'BEGINNING' },
];
const Y_GRID_LABELS = ['0', '20', '40', '60', '80', '100'];

test.describe('task 07 home evidence proof shots', () => {
  test('vertical column-chart figure + navy evidence band on / at 1440×900', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const anchor = page.locator('#evidence');
    await expect(anchor).toBeAttached();
    await expect(anchor.getByText('DIAGNOSTIC TESTING', { exact: true })).toBeVisible();

    // Left text keeps its pinned copy and its link into the diagnostic page.
    await expect(anchor.getByRole('heading', { name: 'See beneath the score' })).toBeVisible();
    await expect(
      anchor.getByText('Reading, listening, speaking, writing - each score hides a spread of sub-skills underneath.'),
    ).toBeVisible();
    await expect(
      anchor.getByRole('link', { name: 'How the diagnostic works' }),
    ).toHaveAttribute('href', '/diagnose');

    // The figure: caption + chip, then the ranked SVG column chart.
    const figure = anchor.locator('figure');
    await expect(figure.getByText('READING: Score 58 / CEFR B1', { exact: true })).toBeVisible();
    await expect(figure.getByText('SUBSKILL PROFILE', { exact: true })).toBeVisible();

    const svg = figure.locator('svg[role="img"]');
    await expect(svg).toHaveAttribute(
      'aria-label',
      'Column chart ranking seven reading subskills by score on the ACARA phase scale, Decoding highest at 72',
    );

    // Task 01's contract, carried over: every plotted value is text. Seven
    // ranked <rect> columns with the value label above each bar.
    const rects = svg.locator('rect');
    await expect(rects).toHaveCount(7);
    const labels = svg.locator('text');
    const labelTexts = await labels.allTextContents();
    for (const column of COLUMNS) {
      expect(labelTexts, `value label ${column.value} renders as text`).toContain(column.value);
      expect(labelTexts, `phase caption ${column.phase} renders as text`).toContain(column.phase);
    }
    // Ranked descending, no old "Term" series anywhere.
    const values = COLUMNS.map((column) => column.value);
    expect(labelTexts.filter((text) => values.includes(text)), 'values render ranked').toEqual(
      values,
    );
    await expect(svg.getByText(/Term \d/)).toHaveCount(0);

    // Y-axis gridline labels 0..100.
    for (const gridLabel of Y_GRID_LABELS) {
      expect(labelTexts, `y gridline label ${gridLabel}`).toContain(gridLabel);
    }

    // The lead column is the accent blue; the rest are the light blue.
    await expect(rects.nth(0)).toHaveAttribute('fill', '#2563EB');
    for (let i = 1; i < 7; i += 1) {
      await expect(rects.nth(i)).toHaveAttribute('fill', '#DBEAFE');
    }

    // The navy Evidence base band keeps its pinned heading and copy.
    const navy = page.locator('section[data-screen-label="Evidence base"]');
    await expect(
      navy.getByRole('heading', { name: 'Built on 40+ years of psychometric research.' }),
    ).toBeVisible();
    await expect(
      navy.getByText(
        "SchoolTest uses well-established psychometric modeling to pinpoint each student's strengths, weaknesses and progression.",
      ),
    ).toBeVisible();

    const shot = await page.screenshot({ type: 'png', fullPage: true });
    mkdirSync(SHOTS_DIR, { recursive: true });
    writeFileSync(path.join(SHOTS_DIR, '07-evidence-1440x900-full.png'), shot);
  });

  test('375px: main content fits and the figure card with its scaled SVG is visible', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto('/');
    await expect(page.locator('#evidence')).toBeAttached();

    // The redesigned page keeps one contained 375px exception — the footer's
    // nowrap acknowledgement line — while everything in <main> fits.
    const mainMax = await page.evaluate(
      () =>
        Math.max(
          ...[...document.querySelectorAll('main, main *')].map(
            (node) => node.getBoundingClientRect().right,
          ),
        ),
    );
    expect(mainMax, 'every main-content node fits the 375px viewport').toBeLessThanOrEqual(376);

    // The figure card is present and its SVG scales to the column (no
    // sideways chart scroller anymore — the columns compress instead).
    const figure = page.locator('#evidence figure');
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
    await expect(svg.locator('rect')).toHaveCount(7);

    const shot = await page.screenshot({ type: 'png', fullPage: true });
    mkdirSync(SHOTS_DIR, { recursive: true });
    writeFileSync(path.join(SHOTS_DIR, '07-evidence-375-full.png'), shot);
  });

  for (const locale of LOCALES) {
    test(`figure renders identically at /${locale} (locale-independent landing copy)`, async ({
      page,
    }) => {
      await page.goto(`/${locale === 'en' ? '' : locale}`);
      const figure = page.locator('#evidence figure');
      await expect(figure.getByText('READING: Score 58 / CEFR B1', { exact: true })).toBeVisible();
      await expect(figure.locator('svg[role="img"] rect')).toHaveCount(7);
      // The hardcoded landing serves the same copy under every locale.
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        'Diagnostic and progress testing for HSP',
      );
    });
  }
});
