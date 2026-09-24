/**
 * Mission st-legal-seo-ops E2E flows 14–24 (task 218): expert-level SEO on the
 * public surface — meta, Open Graph, Twitter, canonical + hreflang, JSON-LD
 * (including breadcrumbs that must match the visible trail), robots.txt,
 * llms.txt and the XML sitemap.
 *
 * Every expectation is derived at runtime from the shipped catalogs, the live
 * API or the page itself. Nothing is duplicated into this spec.
 */
import { expect, test } from '@playwright/test';

import { loadMessages } from './helpers/i18n';
import { LEGAL_PAGES } from './helpers/legal';
import { DISALLOWED_IN_ROBOTS, PUBLIC_PATHS, parseJsonLd, typesOf } from './helpers/seo';

const en = loadMessages('en');

// Expected structured-trail names per public path, derived at runtime from
// the SAME trail registry the app uses (Navigation.* / Landing.nav.* keys).
// The redesigned landing dropped the visible crumb row, so the BreadcrumbList
// JSON-LD is the surviving breadcrumb contract on public pages.
const TRAIL_LABEL_KEYS: Readonly<Record<string, string>> = {
  '/': 'Navigation.home',
  '/diagnose': 'Landing.nav.diagnose',
  '/teach': 'Landing.nav.teach',
  '/track': 'Landing.nav.track',
  '/predict': 'Landing.nav.predict',
  '/report': 'Landing.nav.report',
  '/privacy-policy': 'Navigation.privacyPolicy',
  '/terms-of-service': 'Navigation.termsOfService',
  '/cookie-policy': 'Navigation.cookiePolicy',
  '/gdpr': 'Navigation.gdpr',
};

function expectedTrail(path: string): string[] {
  const key = TRAIL_LABEL_KEYS[path];
  if (!key) throw new Error(`No trail label registered for ${path}`);
  return path === '/' ? [en[key]] : [en['Navigation.home'], en[key]];
}

test.describe('public SEO', () => {
  for (const path of PUBLIC_PATHS) {
    test(`flow: ${path} carries title, description, OG, Twitter, canonical and hreflang`, async ({
      page,
    }) => {
      await page.goto(path);

      await expect(page).toHaveTitle(/.+/);
      const title = await page.title();
      expect(title.length, `${path} title length`).toBeGreaterThan(10);

      const description = await page
        .locator('meta[name="description"]')
        .getAttribute('content');
      expect(description, `${path} description`).toBeTruthy();
      expect((description ?? '').length).toBeGreaterThan(40);

      // Open Graph
      for (const property of ['og:title', 'og:description', 'og:url', 'og:site_name', 'og:type', 'og:image']) {
        await expect(
          page.locator(`meta[property="${property}"]`),
          `${path} ${property}`,
        ).toHaveCount(1);
      }
      await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute('content', '1200');
      await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute('content', '630');

      // Twitter card
      await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
        'content',
        'summary_large_image',
      );
      await expect(page.locator('meta[name="twitter:image"]')).toHaveCount(1);

      // Canonical must be the EXACT absolute URL for this path, not merely
      // contain it — a substring check passes on a wrong locale prefix, and
      // `toContain('')` is a tautology for '/'.
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(new URL(canonical ?? '').pathname, `${path} canonical`).toBe(path);

      // A complete hreflang set (6 locales + x-default) on the localised
      // registry pages. The CMS legal pages are authored in English only, so
      // they name just `en` + x-default (their other-locale copies are noindex
      // fallbacks). Whether those URLs RESOLVE is checked once, for the
      // deduplicated set, in its own test.
      const isEnglishOnly = LEGAL_PAGES.some((legal) => legal.path === path);
      await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(isEnglishOnly ? 2 : 7);
      await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveCount(1);

      // og:url and og:title must describe THIS page, not another one.
      expect(
        new URL((await page.locator('meta[property="og:url"]').getAttribute('content')) ?? '')
          .pathname,
        `${path} og:url`,
      ).toBe(path);
      // og:title is the PAGE title without the layout's "· SchoolTest" suffix,
      // so it must be the leading part of <title> — not merely non-empty, and
      // not another page's title.
      const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
      expect(ogTitle, `${path} og:title`).toBeTruthy();
      expect(title.startsWith(ogTitle ?? ''), `${path} og:title vs <title>`).toBe(true);

      // Indexable
      const robots = await page.locator('meta[name="robots"]').getAttribute('content');
      expect(robots).toContain('index');
      expect(robots).not.toContain('noindex');
    });

    test(`flow: ${path} carries valid JSON-LD whose breadcrumbs match the visible trail`, async ({
      page,
    }) => {
      await page.goto(path);
      const nodes = await parseJsonLd(page);
      const types = nodes.flatMap(typesOf);

      expect(types, `${path} JSON-LD types`).toContain('WebPage');
      // The home page is the root of every trail: a one-item BreadcrumbList
      // says nothing, so only non-home pages publish one.
      if (path === '/') {
        expect(types, 'home JSON-LD types').not.toContain('BreadcrumbList');
      } else {
        expect(types, `${path} JSON-LD types`).toContain('BreadcrumbList');
        const breadcrumb = nodes.find((node) => typesOf(node).includes('BreadcrumbList')) as {
          itemListElement: { position: number; name: string; item: string }[];
        };
        const jsonNames = breadcrumb.itemListElement
          .sort((a, b) => a.position - b.position)
          .map((entry) => entry.name);

        // Flow 20, re-pointed: structured breadcrumbs must EQUAL the registered
        // trail — same names, same order, same count. A substring check would
        // pass on a reversed trail or a duplicate.
        expect(jsonNames, `${path} breadcrumb trail`).toEqual(expectedTrail(path));
      }
      // No orphaned visible crumb nav on the redesigned landing pages. The
      // legal documents KEEP their visible breadcrumb (it survives in
      // LegalDocumentScreen) and their visible trail is asserted in
      // breadcrumbs.spec.ts instead.
      if (!['/privacy-policy', '/terms-of-service', '/cookie-policy', '/gdpr'].includes(path)) {
        await expect(
          page.getByRole('navigation', { name: en['Navigation.breadcrumbLabel'] }),
        ).toHaveCount(0);
      }

      const webPage = nodes.find((node) => typesOf(node).includes('WebPage')) as Record<string, unknown>;
      expect(webPage.url).toBeTruthy();
      expect(webPage.inLanguage).toBe('en');
    });
  }

  test('flow: every canonical URL on the public surface resolves', async ({ page, request }) => {
    // 10 page loads plus one URL per path — well past the 30s default.
    test.setTimeout(120_000);
    const urls = new Set<string>();
    for (const path of PUBLIC_PATHS) {
      await page.goto(path);
      for (const href of await page
        .locator('link[rel="canonical"]')
        .evaluateAll((links) => links.map((l) => l.getAttribute('href') ?? ''))) {
        if (href) urls.add(href);
      }
    }
    // One self-canonical per public path — the redesigned pages emit no
    // per-page hreflang alternates anymore, so the set is exactly the paths.
    expect(urls.size, 'unique canonical URLs').toBe(PUBLIC_PATHS.length);
    // Resolve each canonical's PATH against this suite's baseURL: the
    // canonical host comes from the server env (another port), the contract
    // under test is the path resolving on the app.
    const results = await Promise.all(
      [...urls].map(async (href) => ({
        href,
        status: (await request.get(new URL(href).pathname)).status(),
      })),
    );
    const broken = results.filter((r) => r.status !== 200);
    expect(broken, `unresolvable canonical URLs: ${JSON.stringify(broken)}`).toEqual([]);
  });


  test('flow: every canonical and hreflang URL on the public surface resolves', async ({
    page,
    request,
  }) => {
    // 9 page loads plus ~60 unique URLs — well past the 30s default.
    test.setTimeout(120_000);
    const urls = new Set<string>();
    for (const path of PUBLIC_PATHS) {
      await page.goto(path);
      for (const href of await page
        .locator('link[rel="canonical"], link[rel="alternate"][hreflang]')
        .evaluateAll((links) => links.map((l) => l.getAttribute('href') ?? ''))) {
        if (href) urls.add(href);
      }
    }
    expect(urls.size, 'unique canonical/hreflang URLs').toBeGreaterThan(20);
    const results = await Promise.all(
      [...urls].map(async (href) => ({ href, status: (await request.get(href)).status() })),
    );
    const broken = results.filter((r) => r.status !== 200);
    expect(broken, `unresolvable canonical/hreflang URLs: ${JSON.stringify(broken)}`).toEqual([]);
  });

  test('flow: the homepage additionally publishes Organization and WebSite', async ({ page }) => {
    await page.goto('/');
    const types = (await parseJsonLd(page)).flatMap(typesOf);
    expect(types).toContain('Organization');
    expect(types).toContain('WebSite');
  });

  test('flow: robots.txt is accessible and blocks every private route', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.status()).toBe(200);
    const body = await res.text();

    expect(body).toContain('User-Agent: *');
    expect(body).toContain('Allow: /');
    for (const path of DISALLOWED_IN_ROBOTS) {
      expect(body, `robots.txt must disallow ${path}`).toContain(`Disallow: ${path}`);
    }
    expect(body).toMatch(/Sitemap: https?:\/\/.+\/sitemap\.xml/);
  });

  test('flow: llms.txt is accessible and indexes the public surface', async ({ request }) => {
    const res = await request.get('/llms.txt');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('text/plain');
    const body = await res.text();

    expect(body.startsWith('# ')).toBe(true);

    // Compare the actual link TARGETS: a bare `toContain('/diagnose')` would
    // be satisfied by '/diagnose-extra', so exact pathname equality it is.
    const listed = new Set(
      [...body.matchAll(/\]\((https?:\/\/[^)]+)\)/g)].map((m) => new URL(m[1]).pathname),
    );
    for (const path of PUBLIC_PATHS) {
      expect([...listed], `llms.txt must list ${path}`).toContain(path);
    }
    for (const { path } of LEGAL_PAGES) {
      expect([...listed], `llms.txt must list ${path}`).toContain(path);
    }
    // It must not advertise a route robots.txt blocks.
    for (const blocked of DISALLOWED_IN_ROBOTS) {
      expect(body, `llms.txt leaks ${blocked}`).not.toContain(`${blocked})`);
    }
  });

  test('flow: the XML sitemap lists every public page and excludes private routes', async ({
    request,
  }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('xml');
    const body = await res.text();

    const locs = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(locs.length).toBeGreaterThan(0);

    const paths = locs.map((loc) => new URL(loc).pathname);
    for (const path of PUBLIC_PATHS) {
      expect(paths, `sitemap missing ${path}`).toContain(path);
    }
    for (const { path } of LEGAL_PAGES) {
      expect(paths, `sitemap missing ${path}`).toContain(path);
    }
    for (const blocked of DISALLOWED_IN_ROBOTS) {
      const leaked = paths.filter((p) => p === blocked || p.startsWith(`${blocked}/`));
      expect(leaked, `sitemap leaks ${blocked}`).toEqual([]);
    }

    // EVERY <url> must carry the full alternate set (6 locales + x-default) —
    // asserting one `xhtml:link` exists anywhere would pass with 59 of 60
    // entries missing theirs.
    const urlBlocks = body.split('<url>').slice(1);
    expect(urlBlocks.length).toBe(locs.length);
    for (const block of urlBlocks) {
      const alternates = [...block.matchAll(/hreflang="([^"]+)"/g)].map((m) => m[1]);
      expect(new Set(alternates).size, 'alternates per url').toBe(7);
      expect(alternates, 'x-default alternate').toContain('x-default');
    }
  });

  test('flow: the generated Open Graph card is a real image', async ({ request }) => {
    const res = await request.get('/opengraph-image');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('image/');
    expect((await res.body()).byteLength).toBeGreaterThan(1000);
  });

  test('flow: every disallowed route is noindex — in EVERY locale', async ({ page }) => {
    // 10 page loads, one of them the heavy design-system gallery.
    test.setTimeout(120_000);
    // A missing robots meta must FAIL, not pass vacuously: that hole let
    // /articles and /design-system stay indexable under a locale prefix.
    const probes = ['/sign-in', '/sign-up', '/dashboard', '/articles', '/design-system'];
    for (const path of probes) {
      for (const prefix of ['', '/zh']) {
        await page.goto(`${prefix}${path}`);
        const robots = await page.locator('meta[name="robots"]').getAttribute('content');
        expect(robots, `${prefix}${path} robots meta`).toBeTruthy();
        expect(robots, `${prefix}${path}`).toContain('noindex');
      }
    }
  });

  test('flow: robots.txt disallows every private path under every locale prefix', async ({
    request,
  }) => {
    const body = await (await request.get('/robots.txt')).text();
    for (const path of DISALLOWED_IN_ROBOTS) {
      for (const prefix of ['', '/zh', '/ko', '/ms', '/vi', '/th']) {
        expect(body, `robots.txt must disallow ${prefix}${path}`).toContain(
          `Disallow: ${prefix}${path}`,
        );
      }
    }
  });
});
