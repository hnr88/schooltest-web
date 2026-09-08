import { writeFileSync } from 'node:fs';

import { expect, test } from '@playwright/test';

import { DISALLOWED_IN_ROBOTS, PUBLIC_PATHS } from './helpers/seo';

// Task 09 (landing-pages) PROOF TOOLING — sanctioned shell-Playwright pattern
// (decisions.md "## During implementation", tagged 09). Pins the remount's
// Done-when bullets that the generators only prove at runtime: the raw
// sitemap/robots/llms artefacts (attached + written for proof/09.md), the
// per-locale self-canonical on the remounted routes, the legacy /eald
// redirects, and the route-transition skeleton. URL bases are read
// base-agnostically (pathname only), mirroring seo.spec.

const OUT_DIR = '../mvp/landing-pages/proof/shots';
const LOCALES = ['en', 'zh', 'ko', 'ms', 'vi', 'th'] as const;
const NEW_ROUTES = ['/', '/diagnose', '/teach', '/track', '/predict'] as const;
const LEGACY = [
  { from: '/eald', to: '/' },
  { from: '/eald/diagnose', to: '/diagnose' },
  { from: '/eald/teach', to: '/teach' },
  { from: '/eald/track', to: '/track' },
  { from: '/eald/predict', to: '/predict' },
] as const;

const pathnameOf = (url: string): string => new URL(url, 'http://localhost').pathname;

// Route '/' + locale prefix composes to '/' (en) or '/zh' (non-en), never ''.
const expectedPath = (prefix: string, route: string): string =>
  route === '/' ? prefix || '/' : `${prefix}${route}`;

test('artefacts: sitemap lists the remounted routes ×6 locales with full hreflang; nothing disallowed leaks', async ({
  request,
}, testInfo) => {
  const sitemap = await (await request.get('/sitemap.xml')).text();
  const robots = await (await request.get('/robots.txt')).text();
  const llms = await (await request.get('/llms.txt')).text();
  await testInfo.attach('sitemap.xml', { body: sitemap, contentType: 'application/xml' });
  await testInfo.attach('robots.txt', { body: robots, contentType: 'text/plain' });
  await testInfo.attach('llms.txt', { body: llms, contentType: 'text/plain' });
  writeFileSync(`${OUT_DIR}/09-sitemap.xml`, sitemap);
  writeFileSync(`${OUT_DIR}/09-robots.txt`, robots);
  writeFileSync(`${OUT_DIR}/09-llms.txt`, llms);

  // Sitemap: 9 paths (5 remounted routes + 4 live legal documents) × 6 locales.
  const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => pathnameOf(m[1]));
  expect(paths.length).toBe(PUBLIC_PATHS.length * 6);
  for (const route of NEW_ROUTES) {
    for (const locale of LOCALES) {
      const prefix = locale === 'en' ? '' : `/${locale}`;
      expect(paths, `${route} listed for ${locale}`).toContain(expectedPath(prefix, route));
    }
  }
  expect(paths, 'no /eald URL survives in the sitemap').not.toContain('/eald');

  // Every <url> block carries the full alternate set (6 locales + x-default).
  const urlBlocks = sitemap.split('<url>').slice(1);
  expect(urlBlocks.length).toBe(paths.length);
  for (const block of urlBlocks) {
    const alternates = [...block.matchAll(/hreflang="([^"]+)"/g)].map((m) => m[1]);
    expect(new Set(alternates).size, 'alternates per url').toBe(7);
    expect(alternates, 'x-default alternate').toContain('x-default');
  }

  // Nothing disallowed may appear in the sitemap or llms.txt.
  for (const blocked of DISALLOWED_IN_ROBOTS) {
    const leakedSitemap = paths.filter((p) => p === blocked || p.startsWith(`${blocked}/`));
    expect(leakedSitemap, `sitemap leaks ${blocked}`).toEqual([]);
    expect(llms, `${blocked} absent from llms.txt`).not.toContain(`](${blocked})`);
  }

  // robots.txt: every disallowed path bare AND per non-default locale prefix —
  // the /zh/articles regression guard — and /opengraph-image stays allowed.
  for (const blocked of DISALLOWED_IN_ROBOTS) {
    expect(robots).toContain(`Disallow: ${blocked}`);
    expect(robots).toContain(`Disallow: /zh${blocked}`);
  }
  expect(robots).not.toContain('opengraph-image');

  // llms.txt derives from the same registry: all five remounted routes, no
  // legacy /eald URL. Entries carry ABSOLUTE urls (base from server env), so
  // the route match is base-agnostic.
  for (const route of NEW_ROUTES) {
    const pattern = new RegExp(`\\]\\([^)]*${route === '/' ? '/' : route}\\)`, 'm');
    expect(llms, `llms.txt lists ${route}`).toMatch(pattern);
  }
  expect(llms).not.toContain('/eald');
});

test('canonical: every remounted route advertises itself in all six locales', async ({ request }) => {
  for (const locale of LOCALES) {
    for (const route of NEW_ROUTES) {
      const prefix = locale === 'en' ? '' : `/${locale}`;
      const html = await (await request.get(`${prefix}${route === '/' ? '' : route}`)).text();
      const canonical = pathnameOf(html.match(/<link rel="canonical" href="([^"]+)"/)?.[1] ?? 'about:blank');
      expect(canonical, `self-canonical for ${prefix}${route}`).toBe(expectedPath(prefix, route));
    }
  }
});

test('redirects: every legacy /eald URL 308s to its remounted route', async ({ request }) => {
  for (const { from, to } of LEGACY) {
    const res = await request.get(from, { maxRedirects: 0 });
    expect(res.status(), `${from} permanently redirects`).toBe(308);
    expect(pathnameOf(res.headersArray().find((h) => h.name === 'location')?.value ?? 'about:blank')).toBe(to);
  }
  // Locale-prefixed legacy paths redirect with the prefix preserved.
  const zhDiagnose = await request.get('/zh/eald/diagnose', { maxRedirects: 0 });
  expect(zhDiagnose.status()).toBe(308);
  expect(pathnameOf(zhDiagnose.headersArray().find((h) => h.name === 'location')?.value ?? 'about:blank')).toBe(
    '/zh/diagnose',
  );
});

test('route transition: the diagnose skeleton renders page-shaped chrome while the segment loads', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  // Hold the /diagnose RSC payload forever: with the prefetch/payload unable
  // to resolve, the router renders the target segment's loading.tsx for as
  // long as the capture needs. Registered BEFORE goto so a dev prefetch cannot
  // populate the router cache first (the home itself is untouched — the
  // pattern only matches /diagnose URLs).
  await page.route('**/diagnose*', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    await route.continue();
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.waitForLoadState('networkidle');

  page.on('request', (r) => console.log('T09REQ', r.method(), r.url()));
  await page.getByRole('link', { name: 'See a sample profile', exact: true }).click();
  await expect(page.locator('div.animate-pulse').first()).toBeVisible({ timeout: 45_000 });
  const shot = await page.screenshot({ path: `${OUT_DIR}/09-loading-skeleton-1440.png` });
  await testInfo.attach('09-loading-skeleton-1440', { body: shot, contentType: 'image/png' });

  // Release the hold and settle on the real page.
  await page.unrouteAll();
  await page.goto('/diagnose');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 });
});
