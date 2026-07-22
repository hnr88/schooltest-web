import { expect, test, type Page } from '@playwright/test';
import { loginAsParent } from './helpers/auth';

// REAL pointer measurement: from the element centre, walk outward in 0.5px steps and
// keep the last offset where document.elementFromPoint() still resolves INTO the target
// (the element itself or a descendant). Pure CSS geometry is never consulted.
const POINTER_PROBE = `(el) => {
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const hits = (x, y) => {
    if (x < 0 || y < 0 || x > innerWidth - 1 || y > innerHeight - 1) return false;
    const t = document.elementFromPoint(x, y);
    return !!t && (t === el || el.contains(t) || t.contains(el) && t.closest && false);
  };
  if (!hits(cx, cy)) return { ok: false, reason: 'centre not hittable' };
  const walk = (dx, dy) => {
    let d = 0;
    for (let s = 0.5; s <= 60; s += 0.5) { if (hits(cx + dx * s, cy + dy * s)) d = s; else break; }
    return d;
  };
  const l = walk(-1, 0), rr = walk(1, 0), u = walk(0, -1), dn = walk(0, 1);
  return { ok: true, w: +(l + rr + 0.5).toFixed(1), h: +(u + dn + 0.5).toFixed(1) };
}`;

async function measure(page: Page, label: string, sel: string) {
  const els = page.locator(sel);
  const n = await els.count();
  const out: string[] = [];
  for (let i = 0; i < n; i += 1) {
    const el = els.nth(i);
    if (!(await el.isVisible())) continue;
    const txt = ((await el.textContent()) || '').trim().slice(0, 22);
    const m = await el.evaluate(new Function('el', `return (${POINTER_PROBE})(el)`) as never);
    out.push(`${label}[${txt}] ${JSON.stringify(m)}`);
  }
  return out;
}

test('pointer hit areas', async ({ page }) => {
  await loginAsParent(page);
  for (const [w, h] of [[1440, 900], [375, 812]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.goto('/dashboard/search');
    await expect(page.locator('[data-slot="school-card"]').first()).toBeVisible();
    await page.waitForTimeout(900);
    const rows: string[] = [];
    rows.push(...(await measure(page, 'tab', '[role="tab"]')));
    rows.push(...(await measure(page, 'inputgroup', '[data-slot="input-group"]')));
    rows.push(...(await measure(page, 'input', '[data-slot="input-group"] input')));
    rows.push(...(await measure(page, 'toolbar-btn', '[data-slot="school-search-results"] button')));
    rows.push(...(await measure(page, 'clear', 'button[aria-label="Clear search"]')));
    console.log(`\n#### HIT ${w}x${h}\n` + rows.join('\n'));
  }
});
