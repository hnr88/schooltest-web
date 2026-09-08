import path from 'node:path';

import { expect, test } from '@playwright/test';
import { createViteServer } from 'vitest/node';

// PROOF TOOLING — landing-pages task 01 (figure kit), declared in
// mvp/landing-pages/proof/01.md and mvp/landing-pages/decisions.md.
//
// The app has no route showing grouped-series charts yet (their consumers are
// tasks 07 and 10–13), so this spec renders the REAL BarChart + FigureCard —
// loaded through an in-process Vite SSR module load (no server is started or
// bound; middleware mode only) so the JSX compiles to real React elements —
// dresses the markup in the app's live compiled CSS fetched from
// /design-system (that is how the --chart-1..5 utilities and this task's new
// Tailwind classes get in), and screenshots the result at 1440×900 to
// mvp/landing-pages/proof/shots/01-figure-kit.png. It asserts nothing about
// the app itself; the behavioural assertions live in
// tests/unit/bar-chart-series.test.ts.

test.use({ viewport: { width: 1440, height: 900 } });

test('figure kit harness — 2, 3 and 4 series charts side by side', async ({ page }, testInfo) => {
  const vite = await createViteServer({
    configFile: false,
    root: process.cwd(),
    logLevel: 'error',
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), 'src'),
        'next/navigation': path.resolve(process.cwd(), 'vitest-stubs/next-navigation.ts'),
      },
    },
    ssr: { noExternal: ['next-intl'] },
    server: { middlewareMode: true, hmr: false, watch: null },
  });
  let markup: string;
  try {
    const mod = await vite.ssrLoadModule('./tests/e2e/01-figure-kit-harness.piece.tsx');
    markup = (mod as { buildFigureHarness: () => string }).buildFigureHarness();
  } finally {
    await vite.close();
  }
  expect(markup).toContain('data-slot="figure-card"');

  await page.goto('/design-system', { waitUntil: 'domcontentloaded' });
  const css = await page.evaluate(async () => {
    const parts: string[] = [];
    for (const node of document.querySelectorAll('style')) {
      parts.push(node.textContent ?? '');
    }
    for (const link of document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')) {
      parts.push(await fetch(link.href).then((response) => response.text()));
    }
    return parts.join('\n');
  });
  const htmlClass = await page.evaluate(() => document.documentElement.className);

  const doc = `<!doctype html><html class="${htmlClass}"><head><meta charset="utf-8"><style>${css}</style></head><body>${markup}</body></html>`;
  await page.setContent(doc);

  await expect(page.locator('[data-slot="figure-card"]')).toHaveCount(3);
  await expect(
    page.locator('[data-slot="figure-card"] [data-slot="bar-chart"] li span[style]').first(),
  ).toBeVisible();

  for (const [index, count] of [2, 3, 4].entries()) {
    const chart = page.locator('[data-slot="bar-chart"]').nth(index);
    await expect(chart.locator('li span[style]')).toHaveCount(count * 4);
    const geometry = await chart.evaluate((plot) => {
      const group = plot.querySelector('li > span[aria-hidden="true"]')!;
      const bars = Array.from(group.children).map((bar) => bar.getBoundingClientRect());
      const plotBox = group.getBoundingClientRect();
      const axis = plot.parentElement!.firstElementChild!;
      const ticks = Array.from(axis.children).map((tick) => tick.getBoundingClientRect());
      return {
        plotHeight: plotBox.height,
        heights: bars.map((bar) => bar.height),
        widths: bars.map((bar) => bar.width),
        barGap: bars[1].left - bars[0].right,
        groupGap: Number.parseFloat(getComputedStyle(plot).columnGap),
        tickCenters: ticks.map((tick) => tick.top + tick.height / 2 - plotBox.top),
      };
    });
    expect(geometry.plotHeight).toBe(140);
    expect(geometry.heights.every((height) => height > 0 && height <= 140)).toBe(true);
    expect(geometry.widths.every((width) => width > 0 && width <= 38)).toBe(true);
    expect(geometry.barGap).toBeGreaterThan(0);
    expect(geometry.groupGap).toBeGreaterThan(geometry.barGap);
    geometry.tickCenters.forEach((center, tick) => {
      expect(center).toBeCloseTo((tick * 140) / (geometry.tickCenters.length - 1), 0);
    });
  }

  const shotDir = path.resolve(process.cwd(), '../mvp/landing-pages/proof/shots');
  const shotPath = path.join(shotDir, '01-figure-kit.png');
  await page.screenshot({ path: shotPath });
  await testInfo.attach('01-figure-kit', { path: shotPath });

  await page.setViewportSize({ width: 375, height: 900 });
  expect(await page.evaluate(() => document.body.scrollWidth)).toBe(375);
  const bodies = page.locator('[data-slot="figure-card-body"]');
  for (const body of await bodies.all()) {
    const widths = await body.evaluate((node) => ({
      client: node.clientWidth,
      scroll: node.scrollWidth,
    }));
    expect(widths.scroll).toBeGreaterThan(widths.client);
    await body.evaluate((node) => {
      node.scrollLeft = node.scrollWidth;
    });
    expect(await body.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);
  }
  const mobilePath = path.join(shotDir, '01-figure-kit-375.png');
  await page.screenshot({ path: mobilePath });
  await testInfo.attach('01-figure-kit-375', { path: mobilePath, contentType: 'image/png' });
});
