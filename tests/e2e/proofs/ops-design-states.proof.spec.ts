/**
 * PIXEL proof for the three ops design states, against
 * mvp/claude-design/Ops Portal.dc.html:
 *   :51-58  offline strip     #FDEEEC/#F3C6C1 r16, 36px #B42318 Retry pill
 *   :60-66  read-only strip   #F1F3F7/#DFE5EE, same 16px shape
 *   :851-861 expired overlay  rgba(14,35,80,.72)+blur(3px), 420px card,
 *                             48px #EEF3FE clock tile, full-width 46px pill
 * Verification is computed-style + box measurement (exact expected values from
 * the design file), with PNGs alongside for the visual record.
 *
 * The READ-ONLY state needs the seeded SUPPORT ops persona, so run with:
 *   E2E_OPS_API_EMAIL=opssupport@schooltest.local \
 *   E2E_OPS_API_PASSWORD=<seed support password> \
 *   pnpm exec playwright test tests/e2e/proofs/ops-design-states.proof.spec.ts
 * (env overrides win in tests/e2e/helpers/credentials.ts by design).
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { loginAs } from '../helpers/roles';

const OUT = path.resolve(__dirname, '../../proofs/ops-design-states');
const MEASURED = [
  'backgroundColor',
  'borderTopColor',
  'borderRadius',
  'paddingTop',
  'paddingLeft',
  'rowGap',
  'color',
  'fontSize',
  'fontWeight',
  'marginTop',
  'marginBottom',
  'lineHeight',
  'textAlign',
  'boxShadow',
  'backdropFilter',
] as const;
type Prop = (typeof MEASURED)[number];

async function measure(page: Page, selector: string): Promise<Record<Prop, string>> {
  return page.evaluate(
    ({ selector, props }) => {
      const el = document.querySelector<HTMLElement>(selector);
      if (!el) throw new Error(`no element for ${selector}`);
      const cs = getComputedStyle(el);
      const out = {} as Record<Prop, string>;
      for (const p of props) out[p as Prop] = cs[p as Prop];
      return out;
    },
    { selector, props: MEASURED as unknown as string[] },
  );
}

async function expectStyles(page: Page, selector: string, wants: Partial<Record<Prop, string>>) {
  const m = await measure(page, selector);
  for (const [prop, want] of Object.entries(wants)) {
    expect.soft(m[prop as Prop], `${selector} ${prop}`).toBe(want);
  }
}

async function box(page: Page, selector: string) {
  const b = await page.locator(selector).boundingBox();
  expect(b, selector).not.toBeNull();
  return b as { x: number; y: number; width: number; height: number };
}

async function waitPortal(page: Page) {
  // Arm the listener BEFORE goto: the capabilities call can land during load.
  const capabilities = page.waitForResponse((r) => r.url().includes('/api/ops/capabilities'), { timeout: 20_000 });
  await page.goto('/dashboard/ops/schools');
  await capabilities;
}

test.describe.configure({ mode: 'serial' });

test('offline strip matches Ops Portal.dc.html:51-58', async ({ page }) => {
  await mkdir(OUT, { recursive: true });
  await loginAs(page, 'ops');
  await waitPortal(page);
  await page.context().setOffline(true);
  const strip = page.locator('[data-slot="ops-offline-strip"]');
  await expect(strip).toBeVisible();

  await expectStyles(page, '[data-slot="ops-offline-strip"]', {
    backgroundColor: 'rgb(253, 238, 236)', // #FDEEEC
    borderTopColor: 'rgb(243, 198, 193)', // #F3C6C1
    borderRadius: '16px',
    paddingTop: '14px',
    paddingLeft: '18px',
    rowGap: '14px',
  });
  await expectStyles(page, '[data-slot="ops-offline-strip"] p', {
    color: 'rgb(180, 35, 24)', // #B42318
    fontSize: '13.5px',
    fontWeight: '600',
    marginTop: '0px',
  });
  await expectStyles(page, '[data-slot="ops-offline-strip"] p + p', {
    color: 'rgb(122, 46, 40)', // #7A2E28
    fontSize: '13px',
    marginTop: '2px',
  });
  const icon = await box(page, '[data-slot="ops-offline-strip"] svg');
  expect([icon.width, icon.height]).toEqual([18, 18]);

  const retry = await box(page, '[data-slot="ops-offline-retry"]');
  const m = await measure(page, '[data-slot="ops-offline-retry"]');
  // TW4's rounded-full computes to calc(infinity*1px) = 3.35544e+07px; either
  // that or the classic 9999px is the design's radius:999 pill.
  expect([retry.height, m.paddingLeft, m.backgroundColor, m.fontSize, m.fontWeight]).toEqual([
    36,
    '16px',
    'rgb(180, 35, 24)',
    '13px',
    '600',
  ]);
  expect(parseFloat(m.borderRadius)).toBeGreaterThan(999);

  await strip.screenshot({ path: path.join(OUT, 'offline-strip.png') });
  await page.context().setOffline(false);
  await expect(strip).toBeHidden();
});

test('expired overlay matches Ops Portal.dc.html:851-861', async ({ page }) => {
  await loginAs(page, 'ops');
  await waitPortal(page);
  await page.evaluate(() => localStorage.setItem('app.auth.token', 'proof-expired-token'));
  await page.reload();
  const overlay = page.locator('[data-slot="ops-session-expired"]');
  await expect(overlay).toBeVisible({ timeout: 20_000 });

  await expectStyles(page, '[data-slot="ops-session-expired"]', {
    backgroundColor: 'rgba(14, 35, 80, 0.72)',
    backdropFilter: 'blur(3px)',
    paddingTop: '24px',
  });
  const card = overlay.locator('> div');
  await expectStyles(page, '[data-slot="ops-session-expired"] > div', {
    borderRadius: '24px',
    paddingTop: '32px',
    paddingLeft: '32px',
    textAlign: 'center',
  });
  // TW4 composes box-shadow from --tw-* layers; the real (last) layer is the
  // design's 0 28px 56px rgba(0,0,0,.28). The transparent entries are inert.
  const shadow = (await measure(page, '[data-slot="ops-session-expired"] > div')).boxShadow;
  expect(shadow).toContain('rgba(0, 0, 0, 0.28) 0px 28px 56px 0px');
  expect((await card.boundingBox())?.width).toBe(420);

  const tile = card.locator('> div').first();
  const tileBox = (await tile.boundingBox()) as { width: number; height: number };
  expect([tileBox.width, tileBox.height]).toEqual([48, 48]);
  const tileStyles = await tile.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { bg: cs.backgroundColor, fg: cs.color, radius: cs.borderRadius, mb: cs.marginBottom };
  });
  expect(tileStyles).toEqual({
    bg: 'rgb(238, 243, 254)', // #EEF3FE
    fg: 'rgb(37, 99, 235)', // #2563EB
    radius: '16px',
    mb: '16px',
  });
  const tileIcon = (await card.locator('svg').boundingBox()) as { width: number; height: number };
  expect([tileIcon.width, tileIcon.height]).toEqual([22, 22]);

  await expectStyles(page, '[data-slot="ops-session-expired"] h2', {
    color: 'rgb(14, 35, 80)', // #0E2350
    fontSize: '19px',
    fontWeight: '600',
  });
  await expectStyles(page, '[data-slot="ops-session-expired"] p', {
    color: 'rgb(100, 116, 139)', // #64748B
    fontSize: '14px',
    lineHeight: '22.4px', // 1.6
    marginTop: '10px',
  });
  // The CTA is the design-system Button with href — Link semantics (D21),
  // so it is an ANCHOR, not role=button. Geometry/styling is what we prove.
  const btn = card.locator('a[href], button');
  const btnBox = (await btn.boundingBox()) as { width: number; height: number };
  const cardBox = (await card.boundingBox()) as { width: number; height: number };
  expect(btnBox.height).toBe(46);
  expect(btnBox.width).toBeCloseTo(cardBox.width - 64, 0); // full content width
  const btnStyles = await btn.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { bg: cs.backgroundColor, radius: cs.borderRadius, mt: cs.marginTop, fs: cs.fontSize, fw: cs.fontWeight };
  });
  expect(btnStyles.bg).toBe('rgb(14, 35, 80)');
  expect(parseFloat(btnStyles.radius)).toBeGreaterThan(999);
  expect(btnStyles).toEqual(expect.objectContaining({ mt: '22px', fs: '14px', fw: '600' }));

  await page.screenshot({ path: path.join(OUT, 'session-expired.png') });
});

test('read-only strip matches Ops Portal.dc.html:60-66 (support persona)', async ({ page }) => {
  await loginAs(page, 'opsApi'); // E2E_OPS_API_* must point at the SUPPORT account
  await waitPortal(page);
  const strip = page.locator('[data-slot="ops-capabilities-read-only"]');
  await expect(strip).toBeVisible();
  await expect(strip).toHaveAttribute('data-ops-role', 'ops_support');

  await expectStyles(page, '[data-slot="ops-capabilities-read-only"]', {
    backgroundColor: 'rgb(241, 243, 247)', // #F1F3F7
    borderTopColor: 'rgb(223, 229, 238)', // #DFE5EE
    borderRadius: '16px',
    paddingTop: '14px',
    paddingLeft: '18px',
    rowGap: '14px',
  });
  await expectStyles(page, '[data-slot="ops-capabilities-read-only"] p', {
    color: 'rgb(14, 35, 80)', // #0E2350
    fontSize: '13.5px',
    fontWeight: '600',
  });
  await expectStyles(page, '[data-slot="ops-capabilities-read-only"] p + p', {
    color: 'rgb(124, 134, 152)', // #7C8698
    fontSize: '13px',
  });
  const icon = await box(page, '[data-slot="ops-capabilities-read-only"] svg');
  expect([icon.width, icon.height]).toEqual([18, 18]);

  await strip.screenshot({ path: path.join(OUT, 'read-only-strip.png') });
});
