import { expect, test } from '@playwright/test';
import { loginAsParent } from './helpers/auth';

const OUT = '/tmp/claude-1000/-home-hnr-Code-schooltest/ede58a9d-0975-47c6-937c-98341dfe504b/scratchpad/shots';

async function probe(page: import('@playwright/test').Page, w: number, h: number, tag: string) {
  await page.setViewportSize({ width: w, height: h });
  await page.goto('/dashboard/search');
  await expect(page.locator('[data-slot="school-card"]').first()).toBeVisible();
  await page.waitForTimeout(1200);
  const m = await page.evaluate(() => {
    const scroller = document.querySelector('[data-slot="search-results-scroller"]') as HTMLElement | null;
    const doc = document.scrollingElement as HTMLElement;
    const cards = document.querySelectorAll('[data-slot="school-card"]');
    const slots = new Map<string, number>();
    document.querySelectorAll('[data-slot="school-search-results"] [data-slot]').forEach((el) => {
      const k = el.getAttribute('data-slot')!;
      slots.set(k, (slots.get(k) ?? 0) + 1);
    });
    return {
      scrollerSH: scroller?.scrollHeight, scrollerCH: scroller?.clientHeight,
      ratio: scroller ? +(scroller.scrollHeight / scroller.clientHeight).toFixed(2) : null,
      docSH: doc.scrollHeight, docCH: doc.clientHeight,
      cards: cards.length,
      firstCardH: cards[0] ? Math.round((cards[0] as HTMLElement).getBoundingClientRect().height) : null,
      anchorsInResults: document.querySelectorAll('[data-slot="school-search-results"] a').length,
      buttonsInCard: cards[0] ? cards[0].querySelectorAll('button').length : null,
      slots: Object.fromEntries([...slots.entries()].sort((a,b)=>b[1]-a[1])),
    };
  });
  console.log(`\n### ${tag} ${w}x${h}\n` + JSON.stringify(m, null, 2));
  await page.screenshot({ path: `${OUT}/${tag}-${w}.png` });
}

test('probe density + clickability', async ({ page }) => {
  await loginAsParent(page);
  await probe(page, 1440, 900, 'schools');
  await probe(page, 375, 812, 'schools');
});

test('probe controls geometry', async ({ page }) => {
  await loginAsParent(page);
  for (const [w, h] of [[1440, 900], [375, 812]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.goto('/dashboard/search');
    await expect(page.locator('[data-slot="school-card"]').first()).toBeVisible();
    await page.waitForTimeout(800);
    const r = await page.evaluate(() => {
      const out: Record<string, string> = {};
      const rec = (k: string, el: Element | null) => {
        if (!el) { out[k] = 'MISSING'; return; }
        const b = el.getBoundingClientRect();
        out[k] = `${b.width.toFixed(1)}x${b.height.toFixed(1)}`;
      };
      document.querySelectorAll('[role="tab"]').forEach((el, i) => rec(`tab-${el.textContent}`, el));
      rec('input', document.querySelector('input[type="text"]'));
      rec('input-group', document.querySelector('[data-slot="input-group"]'));
      document.querySelectorAll('[data-slot="school-search-results"] button').forEach((el) => {
        rec(`btn:${(el.textContent || '').slice(0, 24)}`, el);
      });
      return out;
    });
    console.log(`\n### controls ${w}\n` + JSON.stringify(r, null, 2));
  }
});
