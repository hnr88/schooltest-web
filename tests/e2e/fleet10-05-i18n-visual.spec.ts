/**
 * F10 SWEEP 5 — i18n switching + visual sanity at 1440px and 375px.
 *
 * The language switcher lives on the auth layout; zh must be reachable there
 * AND directly via the /zh prefix (the URL is the sole locale source). The
 * zh walk checks 5 major pages for RAW KEY SLUGS (visible "Ops.import.…"),
 * and the 6 major pages get 1440px and 375px screenshots with a horizontal
 * overflow probe.
 */
import { expect, test } from '@playwright/test';

import {
  classify,
  dumpF10Console,
  horizontalOverflow,
  rawKeySlugs,
  settle,
  shot,
  signedInAs,
  watchF10,
} from './fleet10-helpers';

test.describe('F10 i18n + visual sanity', () => {
  test('language switcher on sign-in flips the page to zh and back', async ({ browser }, testInfo) => {
    test.setTimeout(180_000);
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();
    page.setDefaultTimeout(30_000);
    watchF10(page, 'i18n:switcher');
    try {
      await page.goto('/sign-in');
      await settle(page);
      await expect(page.getByRole('heading', { name: 'Log in to the portal' })).toBeVisible({ timeout: 30_000 });

      await page.getByRole('combobox', { name: 'Language' }).click();
      await page.getByRole('option', { name: '中文' }).click();
      await page.waitForURL(/\/zh\/sign-in/, { timeout: 30_000 });
      await settle(page);
      await expect(page.getByRole('heading', { name: '登录门户' })).toBeVisible({ timeout: 30_000 });
      await shot(page, 'i18n/zh-sign-in-switched');

      // … and back to English.
      await page.getByRole('combobox', { name: 'Language' }).click();
      await page.getByRole('option', { name: 'English' }).click();
      await page.waitForURL(/\/sign-in/, { timeout: 30_000 });
      await expect(page.getByRole('heading', { name: 'Log in to the portal' })).toBeVisible({ timeout: 30_000 });
      await shot(page, 'i18n/en-sign-in-switched-back');
      console.log('[f10 i18n] switcher round-trip OK');
    } finally {
      await context.close();
    }
    dumpF10Console(testInfo);
  });

  const ZH_PAGES = [
    { url: '/zh', name: 'landing' },
    { url: '/zh/sign-in', name: 'sign-in' },
    { url: '/zh/teach', name: 'teach' },
    { url: '/zh/track', name: 'track' },
    { url: '/zh/design-system', name: 'design-system' },
  ];

  test('zh walk: five major pages show no raw key slugs', async ({ browser }, testInfo) => {
    test.setTimeout(240_000);
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();
    page.setDefaultTimeout(30_000);
    watchF10(page, 'i18n:zh-walk');
    const allSlugs: Record<string, string[]> = {};
    try {
      for (const target of ZH_PAGES) {
        await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
        await settle(page);
        const outcome = await classify(page);
        const slugs = await rawKeySlugs(page);
        const clipped = await page.evaluate(() => {
          // Crude clipping probe: elements whose text is visibly cut by
          // overflow hidden with a scrollWidth far beyond the client box.
          const bad: string[] = [];
          for (const el of Array.from(document.querySelectorAll<HTMLElement>('h1,h2,h3,button,a,p,td,th')).slice(0, 1200)) {
            if (!el.innerText?.trim()) continue;
            const style = getComputedStyle(el);
            if (style.overflowX !== 'hidden' && style.textOverflow !== 'ellipsis') continue;
            if (el.scrollWidth > el.clientWidth + 24 && style.textOverflow !== 'ellipsis') {
              bad.push(`${el.tagName}:${el.innerText.trim().slice(0, 30)}`);
              if (bad.length >= 5) break;
            }
          }
          return bad;
        });
        await shot(page, `i18n/zh-${target.name}`);
        allSlugs[target.url] = slugs;
        console.log(`[f10 zh] ${target.url} -> ${outcome} rawSlugs=${JSON.stringify(slugs)} clipped=${JSON.stringify(clipped)}`);
        expect(outcome === 'white' || outcome === 'crash').toBe(false);
      }
    } finally {
      await context.close();
    }
    const found = Object.entries(allSlugs).filter(([, slugs]) => slugs.length > 0);
    for (const [url, slugs] of found) {
      console.log(`[F10-ANOMALY] raw i18n key slugs visible on ${url}: ${slugs.join(', ')}`);
    }
    expect(found, 'raw key slugs must not render').toEqual([]);
    dumpF10Console(testInfo);
  });

  const VISUAL_PAGES: Array<{ role: 'ops' | 'schoolAdmin' | 'teacher' | 'parent' | null; url: string; name: string }> = [
    { role: null, url: '/', name: 'landing' },
    { role: null, url: '/sign-in', name: 'sign-in' },
    { role: 'ops', url: '/dashboard/ops/schools', name: 'ops-schools' },
    { role: 'schoolAdmin', url: '/dashboard/school/classes', name: 'sa-classes' },
    { role: 'teacher', url: '/dashboard/results', name: 'teacher-results' },
    { role: 'parent', url: '/dashboard', name: 'parent-dashboard' },
  ];

  for (const width of [1440, 375] as const) {
    test(`visual sanity at ${width}px for six major pages`, async ({ browser }, testInfo) => {
      test.setTimeout(300_000);
      const offenders: string[] = [];
      for (const target of VISUAL_PAGES) {
        let context;
        let page;
        if (target.role) {
          const signed = await signedInAs(browser, target.role, testInfo);
          context = signed.context;
          page = signed.page;
        } else {
          context = await browser.newContext({
            viewport: { width, height: width === 375 ? 812 : 900 },
            storageState: { cookies: [], origins: [] },
          });
          page = await context.newPage();
        }
        await page.setViewportSize({ width, height: width === 375 ? 812 : 900 });
        watchF10(page, `visual${width}:${target.name}`);
        try {
          await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
          await settle(page);
          const overflow = await horizontalOverflow(page);
          await shot(page, `visual/${target.name}-${width}`);
          console.log(`[f10 visual ${width}] ${target.url} overflow=${JSON.stringify(overflow)}`);
          for (const line of overflow) offenders.push(`${target.url}: ${line}`);
        } finally {
          await context.close();
        }
      }
      // Element-level offences are reported; a horizontally scrolling
      // DOCUMENT is the hard failure (the page is unusable).
      const docLevel = offenders.filter((line) => line.includes('document '));
      for (const line of offenders) {
        if (!docLevel.includes(line)) console.log(`[F10-ANOMALY?] ${width}px ${line}`);
      }
      expect(docLevel, `document-level horizontal overflow at ${width}px: ${docLevel.join('; ')}`).toEqual([]);
      dumpF10Console(testInfo);
    });
  }
});
