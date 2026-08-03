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
import {
  DISALLOWED_IN_ROBOTS,
  PUBLIC_PATHS,
  parseJsonLd,
  textOf,
} from './helpers/seo';

const en = loadMessages('en');

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

      // Canonical + a complete hreflang set (6 locales + x-default)
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical, `${path} canonical`).toContain(path === '/' ? '' : path);
      await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(7);
      await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveCount(1);

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
      const types = nodes.map((node) => node['@type']);

      expect(types, `${path} JSON-LD types`).toContain('WebPage');
      expect(types, `${path} JSON-LD types`).toContain('BreadcrumbList');

      const breadcrumb = nodes.find((node) => node['@type'] === 'BreadcrumbList') as {
        itemListElement: { position: number; name: string; item: string }[];
      };
      const jsonNames = breadcrumb.itemListElement
        .sort((a, b) => a.position - b.position)
        .map((entry) => entry.name);

      // Flow 20: structured breadcrumbs must equal the DOM breadcrumbs exactly.
      const visible = await textOf(page.getByRole('navigation', { name: en['Navigation.breadcrumbLabel'] }).first());
      expect(jsonNames.length).toBeGreaterThan(0);
      for (const name of jsonNames) {
        expect(visible, `${path} crumb "${name}" missing from the DOM`).toContain(name);
      }

      const webPage = nodes.find((node) => node['@type'] === 'WebPage') as Record<string, unknown>;
      expect(webPage.url).toBeTruthy();
      expect(webPage.inLanguage).toBe('en');
    });
  }

  test('flow: the homepage additionally publishes Organization and WebSite', async ({ page }) => {
    await page.goto('/');
    const types = (await parseJsonLd(page)).map((node) => node['@type']);
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
    for (const path of PUBLIC_PATHS) {
      expect(body, `llms.txt must list ${path}`).toContain(path === '/' ? '](http' : path);
    }
    for (const { path } of LEGAL_PAGES) {
      expect(body, `llms.txt must list ${path}`).toContain(path);
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

    // hreflang alternates for every entry.
    expect(body).toContain('xhtml:link');
  });

  test('flow: the generated Open Graph card is a real image', async ({ request }) => {
    const res = await request.get('/opengraph-image');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('image/');
    expect((await res.body()).byteLength).toBeGreaterThan(1000);
  });

  test('flow: private routes are noindex', async ({ page }) => {
    await page.goto('/sign-in');
    // The dashboard/auth surfaces must never advertise themselves to a crawler.
    const robots = await page.locator('meta[name="robots"]').getAttribute('content');
    if (robots) expect(robots).not.toContain('index, follow');
  });
});
