/**
 * Task 12 (landing-pages) proof tooling — NOT a regression suite.
 *
 * Renders the artefacts the task's Proof block asks for: the dark hero, the
 * evidence card and the four-series Figure 1 on /track at 1440×900, the
 * 1024px four-series legibility check, and the 375px no-sideways-scroll
 * state. Inherits the wave's paid-for lessons: `#anchor` direct locators,
 * `exact: true` text matching, and the knowledge that BarChart's own inner
 * overflow wrapper is the contained-scroll node. Authorised by the
 * orchestrator's standing end-to-end authority for task 12 (lp-w3-t12).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import { loadMessages } from './helpers/i18n';

const SHOTS_DIR = path.resolve(process.cwd(), '..', 'mvp', 'landing-pages', 'proof', 'shots');
const SERIES = ['term1', 'term2', 'term3', 'term4'];
const CATEGORIES = ['categoryVocabulary', 'categoryInference', 'categoryGrammar', 'categoryCritical'];
const VALUES = [
  ['24', '42', '66', '84'],
  ['18', '30', '52', '72'],
  ['36', '44', '58', '68'],
  ['16', '20', '26', '34'],
];
const BANDS = ['bandBeginning', 'bandDeveloping', 'bandEmerging', 'bandConsolidating', 'bandIndependent'];

test.describe('task 12 track page proof shots', () => {
  test('dark hero, evidence card and four-series figure at 1440×900', async ({ page }) => {
    const en = loadMessages('en');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/track');

    // Dark full-bleed hero from task 05's variant, with the four-cell strip.
    await expect(page.getByText(en['Eald.track.hero.title'])).toBeVisible();
    await expect(page.getByText(en['Eald.track.hero.stat1Label'])).toBeVisible();
    await expect(page.getByText(en['Eald.track.hero.stat4Value'], { exact: true })).toBeVisible();
    // The CTAs reuse existing keys (D-02 budget): diagnose.hero.registerCta
    // and footer.predict carry the exact design labels. Both strings also
    // appear in the site chrome, so the assertions scope to #main-content.
    const main = page.locator('#main-content');
    await expect(main.getByText(en['Eald.diagnose.hero.registerCta'])).toBeVisible();
    await expect(main.getByText(en['Eald.footer.predict'])).toBeVisible();

    // Evidence card: chip + the four ordered TERMS rows. Scoped to the card —
    // its phase strings also render as chart band labels and axis ticks. The
    // card shows 'Consolidating' twice by design (chip + Term 4 row), so the
    // two are asserted by their own span classes.
    const evidenceCard = page.locator('div.rounded-3xl.border-border.bg-white');
    await expect(evidenceCard.getByText(en['Eald.track.evidence.skill'])).toBeVisible();
    await expect(
      evidenceCard.locator('span.bg-teal-100', {
        hasText: en['Eald.track.evidence.currentPhase'],
      }),
    ).toBeVisible();
    for (const key of ['term1Phase', 'term2Phase', 'term3Phase', 'term4Phase']) {
      await expect(
        evidenceCard.locator('span.text-base.font-semibold', {
          hasText: en[`Eald.track.evidence.${key}` as const],
        }),
      ).toBeVisible();
    }

    // Legend labels live inside the figure card (the evidence card is a
    // different band); exact matching excludes task 01's sr-only cells.
    const figureCard = page.locator('[data-slot="figure-card"]').first();
    await expect(figureCard).toBeVisible();
    for (const key of SERIES) {
      await expect(
        figureCard.getByText(en[`Eald.track.evidence.${key}Label` as const], { exact: true }),
      ).toHaveCount(1);
    }
    // Band labels are scoped to the chart band section — 'Consolidating' and
    // friends also render inside the evidence card, by design.
    const chartBand = page.locator('section.border-y');
    for (const key of BANDS) {
      await expect(chartBand.getByText(en[`Eald.track.progress.${key}` as const])).toBeVisible();
    }
    let exposed = 0;
    const chart = page.getByRole('list', { name: en['Eald.track.progress.ariaLabel'] });
    await expect(chart).toBeVisible();
    for (let c = 0; c < CATEGORIES.length; c += 1) {
      for (let s = 0; s < SERIES.length; s += 1) {
        const text = `${en[`Eald.track.evidence.${SERIES[s]}Label` as const]} ${en[`Eald.track.progress.${CATEGORIES[c]}` as const]}: ${VALUES[c][s]}`;
        await expect(chart.getByText(text, { exact: true })).toBeAttached();
        exposed += 1;
      }
    }
    expect(exposed).toBe(16);
    await expect(page.getByText(en['Eald.track.progress.footnote'])).toBeVisible();

    const shot = await page.screenshot({ type: 'png', fullPage: true });
    mkdirSync(SHOTS_DIR, { recursive: true });
    writeFileSync(path.join(SHOTS_DIR, '12-track-1440x900-full.png'), shot);
  });

  test('four-series legend and bars stay legible at 1024px', async ({ page }) => {
    const en = loadMessages('en');
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.goto('/track');

    const figureCard = page.locator('[data-slot="figure-card"]').first();
    await expect(figureCard).toBeVisible();
    const chart = page.getByRole('list', { name: en['Eald.track.progress.ariaLabel'] });
    await expect(chart).toBeVisible();
    for (const key of SERIES) {
      await expect(
        figureCard.getByText(en[`Eald.track.evidence.${key}Label` as const], { exact: true }),
      ).toBeVisible();
    }
    for (const key of CATEGORIES) {
      await expect(
        figureCard.getByText(en[`Eald.track.progress.${key}` as const], { exact: true }),
      ).toBeVisible();
    }

    const shot = await page.screenshot({ type: 'png', fullPage: true });
    mkdirSync(SHOTS_DIR, { recursive: true });
    writeFileSync(path.join(SHOTS_DIR, '12-track-1024-legend.png'), shot);
  });

  test('375px: no sideways body scroll; figure and its scroll container present', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto('/track');

    // FigureCard is the direct grid item and carries the kit's own min-w-0,
    // so the body must not scroll sideways (task 11's finding does not apply).
    const noSideways = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    );
    expect(noSideways, 'page body must not scroll sideways at 375px').toBe(true);

    const scrollable = page
      .locator('[data-slot="figure-card"] div.overflow-x-auto')
      .last();
    await expect(scrollable).toBeVisible();

    const shot = await page.screenshot({ type: 'png', fullPage: true });
    mkdirSync(SHOTS_DIR, { recursive: true });
    writeFileSync(path.join(SHOTS_DIR, '12-track-375-full.png'), shot);
  });
});
