// @vitest-environment node
import path from 'node:path';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

import { describe, expect, test } from 'vitest';

import {
  AI_CRAWLERS,
  DISALLOWED_PATHS,
  PUBLIC_ROUTES,
  SEARCH_ENGINE_CRAWLERS,
} from '@/modules/seo/constants/public-routes';
import { buildRobots } from '@/modules/seo/lib/build-robots';
import { buildSitemapEntries } from '@/modules/seo/lib/build-sitemap';
import type { PublicEntry } from '@/modules/seo/types/metadata.types';

const BASE = 'http://localhost:3000';
const ROOT = path.resolve(__dirname, '../..');

describe('robots', () => {
  const robots = buildRobots(BASE);
  const rules = Array.isArray(robots.rules) ? robots.rules : [robots.rules];

  test('names every required search engine and AI crawler', () => {
    const agents = rules.flatMap((rule) => [rule.userAgent ?? []].flat());
    for (const bot of [
      'Googlebot', 'Bingbot', 'DuckDuckBot', 'Applebot', 'YandexBot', 'Baiduspider',
      'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-User', 'Claude-SearchBot',
      'anthropic-ai', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended',
      'CCBot', 'Bytespider', 'Amazonbot', 'Meta-ExternalAgent', 'cohere-ai', 'DuckAssistBot',
      'MistralAI-User', '*',
    ]) {
      expect(agents).toContain(bot);
    }
    expect(agents).toHaveLength(SEARCH_ENGINE_CRAWLERS.length + AI_CRAWLERS.length + 1);
  });

  test('every group allows the public site and disallows every private path under every locale', () => {
    for (const rule of rules) {
      expect(rule.allow).toBe('/');
      for (const blocked of DISALLOWED_PATHS) {
        expect(rule.disallow).toContain(blocked);
        for (const locale of ['zh', 'ko', 'ms', 'vi', 'th']) {
          expect(rule.disallow).toContain(`/${locale}${blocked}`);
        }
      }
      for (const route of PUBLIC_ROUTES) expect(rule.disallow).not.toContain(route.pathname);
    }
  });

  test('keeps sitemap and host', () => {
    expect(robots.sitemap).toBe(`${BASE}/sitemap.xml`);
    expect(robots.host).toBe(BASE);
  });
});

describe('sitemap', () => {
  const entries: PublicEntry[] = [
    { pathname: '/', title: 'Home', description: 'd', lastModified: '2026-09-24', changeFrequency: 'weekly', priority: 1, section: 'pages' },
    { pathname: '/privacy-policy', title: 'Privacy', description: 'd', lastModified: '2026-08-01T10:00:00.000Z', changeFrequency: 'yearly', priority: 0.4, section: 'legal' },
    { pathname: '/articles/only-en', title: 'Post', description: 'd', lastModified: '2026-09-02', changeFrequency: 'monthly', priority: 0.6, section: 'articles', locales: ['en', 'zh'], images: [`${BASE}/img/a.webp`] },
  ];
  const sitemap = buildSitemapEntries(entries);

  test('one url per entry x published locale', () => {
    expect(sitemap).toHaveLength(6 + 6 + 2);
    expect(sitemap.map((u) => u.url)).toContain(`${BASE}/zh/privacy-policy`);
    expect(sitemap.map((u) => u.url)).toContain(`${BASE}/`);
  });

  test('carries the real lastModified, never request time', () => {
    const legal = sitemap.find((u) => u.url === `${BASE}/ko/privacy-policy`);
    expect(legal?.lastModified).toEqual(new Date('2026-08-01T10:00:00.000Z'));
    expect(legal?.changeFrequency).toBe('yearly');
    expect(legal?.priority).toBe(0.4);
  });

  test('hreflang alternates cover every published locale plus x-default', () => {
    const home = sitemap.find((u) => u.url === `${BASE}/th`);
    expect(Object.keys(home?.alternates?.languages ?? {})).toEqual(['en', 'zh', 'ko', 'ms', 'vi', 'th', 'x-default']);
    const post = sitemap.find((u) => u.url === `${BASE}/zh/articles/only-en`);
    expect(post?.alternates?.languages).toEqual({
      en: `${BASE}/articles/only-en`,
      zh: `${BASE}/zh/articles/only-en`,
      'x-default': `${BASE}/articles/only-en`,
    });
  });

  test('image sitemap lists the locale social card plus content images', () => {
    const post = sitemap.find((u) => u.url === `${BASE}/zh/articles/only-en`);
    expect(post?.images).toEqual([`${BASE}/zh/opengraph-image`, `${BASE}/img/a.webp`]);
  });

  test('registry dates are real ISO dates', () => {
    for (const route of PUBLIC_ROUTES) {
      expect(Number.isNaN(Date.parse(route.lastModified))).toBe(false);
    }
  });
});

describe('X-Robots-Tag headers (next.config.ts)', () => {
  test('cover every disallowed path, bare and locale-prefixed, as Next loads the config', async () => {
    const require = createRequire(import.meta.url);
    const { transpileConfig } = require(
      path.join(ROOT, 'node_modules/next/dist/build/next-config-ts/transpile-config.js'),
    ) as { transpileConfig: (o: { nextConfigPath: string; dir: string }) => Promise<unknown> };
    const loaded = (await transpileConfig({ nextConfigPath: path.join(ROOT, 'next.config.ts'), dir: ROOT })) as {
      default?: unknown;
    };
    const config = (loaded.default ?? loaded) as {
      headers: () => Promise<{ source: string; headers: { key: string; value: string }[] }[]>;
    };
    const noindex = (await config.headers())
      .filter((h) => h.headers.some((x) => x.key === 'X-Robots-Tag' && x.value.includes('noindex')))
      .map((h) => h.source);
    for (const blocked of DISALLOWED_PATHS) {
      expect(noindex).toEqual(
        expect.arrayContaining([blocked, `${blocked}/:rest*`, `/:locale([a-z]{2})${blocked}`, `/:locale([a-z]{2})${blocked}/:rest*`]),
      );
    }
    expect(noindex).toHaveLength(DISALLOWED_PATHS.length * 4);
  });
});

describe('Seo.pages copy', () => {
  test('every registry page has a title and description in every locale within budget', () => {
    for (const locale of ['en', 'zh', 'ko', 'ms', 'vi', 'th']) {
      const messages = JSON.parse(
        readFileSync(path.join(ROOT, `src/i18n/messages/${locale}.json`), 'utf8'),
      ) as { Seo: { pages: Record<string, { title: string; description: string }> } };
      for (const route of PUBLIC_ROUTES) {
        const page = messages.Seo.pages[route.seoKey];
        expect(page, `${locale} ${route.seoKey}`).toBeDefined();
        const branded = route.pathname === '/' ? page.title : `${page.title} · SchoolTest`;
        expect(branded.length, `${locale} ${route.seoKey} title`).toBeLessThanOrEqual(60);
        expect(page.description.length, `${locale} ${route.seoKey} description`).toBeLessThanOrEqual(160);
      }
    }
  });
});
