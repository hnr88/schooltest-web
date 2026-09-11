/**
 * Wave-2 design-state proof — ops LOAD ERROR / SLOW / FLAKY against
 * `mvp/claude-design/Ops Portal.dc.html`:
 *   - list error card  :126-138 (48px radius-16 #FDEEEC tile + circle-alert,
 *     16/600 title, 13.5 body max-w-400, 42px navy Try again + 42px white
 *     Status page)
 *   - detail error card:243-252 (same tile, one navy Try again)
 * States are driven by REAL network conditions via route interception
 * (abort / 500 / latency), never canned UI data. Evidence shots:
 * tests/proofs/ops-design-states/.
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { loginAs } from '../helpers/roles';

const SHOTS = path.resolve(process.cwd(), 'tests/proofs/ops-design-states');
const LIST_GLOB = '**/api/ops/schools*';
const DETAIL_GLOB = '**/api/ops/schools/*';
const ERROR_TILE = '[data-slot="directory-error"] > div';
const ERROR_TITLE = 'We could not load schools';
const DETAIL_ERROR_TITLE = 'We could not load this school';

async function shot(page: Page, name: string): Promise<void> {
  await mkdir(SHOTS, { recursive: true });
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`) });
}

async function styles(page: Page, selector: string, props: string[]): Promise<Record<string, string>> {
  return page.$eval(
    selector,
    (el, list) => {
      const cs = getComputedStyle(el);
      return Object.fromEntries(list.map((p) => [p, cs.getPropertyValue(p)]));
    },
    props,
  );
}

test.describe('ops design states: load error / slow / flaky', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await loginAs(page, 'ops');
  });

  test('list loadError: abort renders the :126-138 card, exact pixels; unintercept + Try again recovers', async ({
    page,
  }) => {
    await page.route(LIST_GLOB, (route) => route.abort('failed'));
    await page.goto('/dashboard/ops/schools');
    const card = page.locator('[data-slot="directory-error"]');
    await expect(card).toBeVisible({ timeout: 20_000 });
    await expect(card.getByRole('heading', { name: ERROR_TITLE })).toBeVisible();

    const tile = await styles(page, ERROR_TILE, [
      'width',
      'height',
      'border-radius',
      'background-color',
      'color',
    ]);
    expect(tile).toEqual({
      width: '48px',
      height: '48px',
      'border-radius': '16px',
      'background-color': 'rgb(253, 238, 236)', // #FDEEEC
      color: 'rgb(180, 35, 24)', // #B42318
    });
    // The design's glyph is circle-alert (:129) — an svg circle, not a triangle.
    await expect(card.locator('svg circle')).toHaveCount(1);

    const title = await styles(page, '[data-slot="directory-error"] h2', ['font-size', 'font-weight']);
    expect(title).toEqual({ 'font-size': '16px', 'font-weight': '600' });

    const body = await styles(page, '[data-slot="directory-error"] p', [
      'font-size',
      'max-width',
      'line-height',
    ]);
    expect(body['font-size']).toBe('13.5px');
    expect(body['max-width']).toBe('400px');
    expect(Number.parseFloat(body['line-height'])).toBeCloseTo(21.6, 0); // 13.5 × 1.6

    const buttons = card.locator('button');
    await expect(buttons).toHaveText(['Try again', 'Status page']);
    const retry = await styles(page, '[data-slot="directory-error"] button >> nth=0', [
      'height',
      'background-color',
      'border-radius',
    ]);
    // #0E2350 = rgb(14, 35, 80). Tailwind v4's rounded-full is calc(infinity*1px),
    // which Chromium reports clamped to 2^25 px — a pill either way.
    expect(retry['height']).toBe('42px');
    expect(retry['background-color']).toBe('rgb(14, 35, 80)');
    expect(Number.parseFloat(retry['border-radius'])).toBeGreaterThan(1000);
    const status = await styles(page, '[data-slot="directory-error"] button >> nth=1', [
      'height',
      'background-color',
    ]);
    expect(status).toEqual({ height: '42px', 'background-color': 'rgb(255, 255, 255)' });
    await shot(page, 'list-load-error');

    // Unintercept → Try again recovers into the real list.
    await page.unroute(LIST_GLOB);
    await buttons.first().click();
    await expect(card).toHaveCount(0, { timeout: 20_000 });
    await expect(page.locator('a[href^="/dashboard/ops/schools/"]').first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test('list loadError: a 500 envelope renders the same card', async ({ page }) => {
    await page.route(LIST_GLOB, (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":{}}' }),
    );
    await page.goto('/dashboard/ops/schools');
    await expect(page.locator('[data-slot="directory-error"]')).toBeVisible({ timeout: 20_000 });
  });

  test('detail loadError: abort renders the :243-252 card; Try again recovers', async ({ page }) => {
    const apiBase = process.env.E2E_API_BASE_URL ?? 'http://localhost:5500';
    const login = await page.request.post(`${apiBase}/api/auth/local`, {
      data: { identifier: 'admin@schooltest.local', password: 'Admin1234!' },
    });
    const jwt = ((await login.json()) as { jwt: string }).jwt;
    const list = await page.request.get(`${apiBase}/api/ops/schools?pageSize=1`, {
      headers: { Authorization: `Bearer ${jwt}`, 'x-ops-portal-version': '1' },
    });
    const rows = ((await list.json()) as { data: Array<{ documentId: string }> }).data;
    expect(rows.length).toBeGreaterThan(0);
    const documentId = rows[0].documentId;

    await page.route(DETAIL_GLOB, (route) => route.abort('failed'));
    await page.goto(`/dashboard/ops/schools/${documentId}`);
    const card = page.locator('main > div.text-center');
    await expect(card).toBeVisible({ timeout: 20_000 });
    await expect(card).toContainText(DETAIL_ERROR_TITLE);

    const cardBox = await styles(page, 'main > div.text-center', ['padding', 'border-radius']);
    expect(cardBox.padding).toBe('52px 32px');

    const tile = await styles(page, 'main > div.text-center > div', [
      'width',
      'height',
      'border-radius',
      'background-color',
    ]);
    expect(tile).toEqual({
      width: '48px',
      height: '48px',
      'border-radius': '16px',
      'background-color': 'rgb(253, 238, 236)',
    });
    await expect(card.locator('svg circle')).toHaveCount(1);

    const body = await styles(page, 'main > div.text-center p', ['font-size', 'max-width']);
    expect(body).toEqual({ 'font-size': '13.5px', 'max-width': '400px' });

    // The design-system navy token serializes as lab(); compare it to #0E2350
    // per-channel on a canvas (the token is the theme's stand-in for #0E2350,
    // `globals.css` "navy-900 — #0E2350", so only a tiny conversion delta is
    // tolerated, not a different hue).
    const detailNavy = await page.$eval(
      'main > div.text-center button',
      (el) => {
        const bg = getComputedStyle(el).backgroundColor;
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 2;
        const ctx = canvas.getContext('2d');
        if (!ctx) return { maxDelta: Infinity, height: getComputedStyle(el).height };
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, 1, 1);
        ctx.fillStyle = '#0E2350';
        ctx.fillRect(0, 1, 1, 1);
        const a = ctx.getImageData(0, 0, 1, 1).data;
        const b = ctx.getImageData(0, 1, 1, 1).data;
        const maxDelta = Math.max(...[0, 1, 2].map((i) => Math.abs(a[i] - b[i])));
        return { maxDelta, height: getComputedStyle(el).height };
      },
    );
    expect(detailNavy.maxDelta).toBeLessThan(8);
    expect(detailNavy.height).toBe('42px');
    await shot(page, 'detail-load-error');

    await page.unroute(DETAIL_GLOB);
    await card.getByRole('button', { name: 'Try again' }).click();
    await expect(page.locator('[data-slot="ops-school-detail"]')).toBeVisible({ timeout: 20_000 });
  });

  test('slow: latency shows the skeleton arm, then real data — no error card', async ({ page }) => {
    await page.route(LIST_GLOB, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 900));
      await route.continue();
    });
    await page.goto('/dashboard/ops/schools');
    const loading = page.locator('[data-slot="directory-loading"]');
    await expect(loading).toBeVisible({ timeout: 20_000 });
    await expect(loading).toBeHidden({ timeout: 20_000 });
    await expect(page.locator('[data-slot="directory-error"]')).toHaveCount(0);
    await expect(page.locator('a[href^="/dashboard/ops/schools/"]').first()).toBeVisible();
  });

  test('flaky: fail twice then succeed — error card shown honestly each failure, data only on success', async ({
    page,
  }) => {
    let calls = 0;
    await page.route(LIST_GLOB, async (route) => {
      calls += 1;
      if (calls <= 2) {
        await route.abort('failed');
        return;
      }
      await route.continue();
    });
    await page.goto('/dashboard/ops/schools');
    const card = page.locator('[data-slot="directory-error"]');
    await expect(card).toBeVisible({ timeout: 20_000 }); // call 1 failed

    const retry = card.getByRole('button', { name: 'Try again' });
    await retry.click();
    await expect(card).toBeVisible({ timeout: 20_000 }); // call 2 failed — still honest error
    expect(calls).toBe(2);

    await retry.click();
    await expect(card).toHaveCount(0, { timeout: 20_000 }); // call 3 succeeded
    await expect(page.locator('a[href^="/dashboard/ops/schools/"]').first()).toBeVisible();
    expect(calls).toBe(3);
  });
});
