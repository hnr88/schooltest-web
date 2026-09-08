/**
 * Task 07 (landing-pages) proof tooling — NOT a regression suite.
 *
 * Renders the proof artefacts the task's Proof block asks for: the #evidence
 * chart band and the navy Evidence base band on /eald at 1440×900, the 375px
 * figure-contained-scroll state, and the six-locale footnote render (D-10).
 * Declared in mvp/landing-pages/decisions.md; runs through the sanctioned
 * shell `pnpm exec playwright test` under the orchestrator's lane grant.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import { loadMessages } from './helpers/i18n';

const SHOTS_DIR = path.resolve(process.cwd(), '..', 'mvp', 'landing-pages', 'proof', 'shots');
const LOCALES = ['en', 'zh', 'ko', 'ms', 'vi', 'th'] as const;

test.describe('task 07 home evidence proof shots', () => {
  test('chart band + navy evidence band on /eald at 1440×900', async ({ page }) => {
    const en = loadMessages('en');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/eald');

    const anchor = page.locator('#evidence');
    await expect(anchor).toBeAttached();
    await expect(anchor).toHaveClass(/scroll-mt-24/);
    await expect(anchor.getByText(en['Eald.home.evidenceChart.eyebrow'])).toBeVisible();
    await expect(anchor.getByText(en['Eald.home.evidenceChart.figureTitle'])).toBeVisible();
    await expect(anchor.getByText(en['Eald.home.evidenceChart.figureContext'])).toBeVisible();
    // Legend above the plot: the three sitting labels as EXACT legend texts
    // (substring matching would also hit the sr-only "… <label>: <value>"
    // cells task 01 renders for each bar).
    for (const key of ['seriesTerm1', 'seriesTerm2', 'seriesTerm4']) {
      await expect(
        anchor.getByText(en[`Eald.home.evidenceChart.${key}` as const], { exact: true }),
      ).toHaveCount(1);
    }
    // Five ACARA band labels on the y-axis.
    for (const key of [
      'bandBeginning',
      'bandDeveloping',
      'bandEmerging',
      'bandConsolidating',
      'bandIndependent',
    ]) {
      await expect(
        anchor.getByText(en[`Eald.home.evidenceChart.${key}` as const]),
      ).toBeVisible();
    }
    // Task 01's contract: every plotted value is text. 4 categories × 3 series.
    const chart = page.getByRole('list', { name: en['Eald.home.evidenceChart.ariaLabel'] });
    await expect(chart).toBeVisible();
    const series = ['seriesTerm1', 'seriesTerm2', 'seriesTerm4'];
    const categories = ['categoryReading', 'categoryListening', 'categoryWriting', 'categorySpeaking'];
    const values = [
      ['42', '68', '84'],
      ['34', '58', '74'],
      ['30', '48', '64'],
      ['26', '38', '54'],
    ];
    let exposed = 0;
    for (let c = 0; c < categories.length; c += 1) {
      for (let s = 0; s < series.length; s += 1) {
        const text = `${en[`Eald.home.evidenceChart.${series[s]}` as const]} ${en[`Eald.home.evidenceChart.${categories[c]}` as const]}: ${values[c][s]}`;
        await expect(chart.getByText(text, { exact: true })).toBeAttached();
        exposed += 1;
      }
    }
    expect(exposed).toBe(12);
    await expect(anchor.getByText(en['Eald.home.evidenceChart.footnote'])).toBeVisible();

    // Fallback capture authorised by the orchestrator (chat-b960608d): one
    // full-page shot at 1440×900 instead of chasing element locators — the
    // #evidence band and the navy Evidence base band are both in frame.
    const shot = await page.screenshot({ type: 'png', fullPage: true });
    mkdirSync(SHOTS_DIR, { recursive: true });
    writeFileSync(path.join(SHOTS_DIR, '07-eald-evidence-1440x900-full.png'), shot);

    // The navy Evidence base band: STATS cells with their existing copy —
    // asserted, and covered by the full-page capture above.
    const navy = page.locator('div.rounded-4xl.bg-navy-800');
    await expect(navy.getByText(en['Eald.home.proof.badge'])).toBeVisible();
    for (const key of ['skillsValue', 'yearsValue', 'scalesValue', 'durationValue']) {
      await expect(navy.getByText(en[`Eald.home.proof.${key}` as const])).toBeVisible();
    }
  });

  test('375px: no sideways body scroll; figure card and its scroll container visible', async ({
    page,
  }) => {
    const en = loadMessages('en');
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto('/eald');
    await expect(page.locator('#evidence')).toBeAttached();

    // No sideways page scroll.
    const noSideways = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    );
    expect(noSideways, 'page body must not scroll sideways at 375px').toBe(true);

    // The figure card is present with BarChart's own overflow container
    // (the contained-scroll mechanism); asserted visibly, captured in the
    // full-page shot below.
    const card = page.locator('[data-slot="figure-card"]').first();
    await expect(card).toBeVisible();
    const scrollable = card.locator('div.overflow-x-auto').last();
    await expect(scrollable).toBeVisible();

    const shot = await page.screenshot({ type: 'png', fullPage: true });
    mkdirSync(SHOTS_DIR, { recursive: true });
    writeFileSync(path.join(SHOTS_DIR, '07-eald-evidence-375-full.png'), shot);
  });

  for (const locale of LOCALES) {
    test(`footnote renders verbatim at /${locale}/eald (D-10)`, async ({ page }) => {
      const messages = loadMessages(locale);
      await page.goto(`/${locale}/eald`);
      await expect(
        page.getByText(messages['Eald.home.evidenceChart.footnote']),
      ).toBeVisible();
    });
  }
});
