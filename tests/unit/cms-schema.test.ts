import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, test } from 'vitest';

import { cmsPageListResponseSchema, cmsPageResponseSchema, cmsLayoutResponseSchema } from '@/modules/cms/schemas/cms.schema';
import { buildToc, pageToText, readingMinutes, blocksToText } from '@/modules/cms/lib/cms-text';
import { canonicalPathFrom, cmsPagePath } from '@/modules/cms/lib/cms-paths';
import { buildRssFeed } from '@/modules/cms/lib/feed';
import { cmsMetadataInput } from '@/modules/cms/lib/cms-metadata';
import { cmsFaqEntries } from '@/modules/cms/lib/cms-json-ld';

const fixture = JSON.parse(
  readFileSync(resolve(process.cwd(), 'tests/unit/fixtures/cms-page.fixture.json'), 'utf8'),
) as unknown;

describe('CMS schemas — the Strapi page/layout envelopes', () => {
  test('a full page with every section type parses; unknown sections/blocks are kept as inert "unknown"', () => {
    const page = cmsPageResponseSchema.parse(fixture).data;
    expect(page.sections.map((s) => s.__component)).toEqual([
      'sections.key-takeaways',
      'sections.heading-text',
      'sections.faq-list',
      'sections.callout',
      'sections.contact-block',
      'sections.cta',
      'sections.media',
      'sections.rich-text',
      'unknown',
    ]);
    const rich = page.sections[7];
    expect(rich.__component === 'sections.rich-text' && rich.body[1]).toEqual({ type: 'unknown' });
  });

  test('a malformed known section fails the parse instead of rendering half a page', () => {
    const broken = structuredClone(fixture) as { data: { sections: Array<Record<string, unknown>> } };
    broken.data.sections[1] = { id: 2, __component: 'sections.heading-text', body: [] };
    expect(cmsPageResponseSchema.safeParse(broken).success).toBe(false);
  });

  test('pageType is a closed set', () => {
    const bad = structuredClone(fixture) as { data: Record<string, unknown> };
    bad.data.pageType = 'landing';
    expect(cmsPageResponseSchema.safeParse(bad).success).toBe(false);
  });

  test('list + layout envelopes parse with defaults', () => {
    const list = cmsPageListResponseSchema.parse({
      data: [{ documentId: 'x', title: 'T', slug: 't', pageType: 'legal', locale: 'en', updatedAt: '2026-01-01' }],
      meta: { pagination: { page: 1, pageSize: 25, pageCount: 1, total: 1 } },
    });
    expect(list.data[0].slug).toBe('t');
    const layout = cmsLayoutResponseSchema.parse({ data: { locale: 'en', footerGroups: [{ title: 'Legal' }] }, meta: {} });
    expect(layout.data.footerGroups[0].links).toEqual([]);
    expect(layout.data.headerLinks).toEqual([]);
  });
});

describe('CMS helpers', () => {
  const page = cmsPageResponseSchema.parse(fixture).data;

  test('plain text, reading time and TOC come from the sections', () => {
    const text = pageToText(page);
    expect(text).toContain('### Who this applies to');
    expect(text).toContain('Plain bolda link');
    expect(text).toContain('- Item one.');
    expect(text).toContain('Q: Is it free?');
    expect(readingMinutes(text)).toBe(1);
    expect(buildToc(page.sections)).toEqual([{ id: 'who', text: 'Who this applies to' }]);
    expect(blocksToText([])).toBe('');
  });

  test('paths: articles under /articles, legal/info at the root; canonical override only on-site', () => {
    expect(cmsPagePath({ slug: 'a', pageType: 'article' })).toBe('/articles/a');
    expect(cmsPagePath({ slug: 'privacy-policy', pageType: 'legal' })).toBe('/privacy-policy');
    expect(canonicalPathFrom('/terms-of-service', 'https://site.test')).toBe('/terms-of-service');
    expect(canonicalPathFrom('https://site.test/gdpr', 'https://site.test')).toBe('/gdpr');
    expect(canonicalPathFrom('https://evil.test/gdpr', 'https://site.test')).toBeUndefined();
    expect(canonicalPathFrom('//evil.test', 'https://site.test')).toBeUndefined();
  });

  test('SEO component → buildMetadata input (noindex, article type, keywords, author, fallback)', () => {
    const input = cmsMetadataInput({ page, requestedLocale: 'en', isFallback: false });
    expect(input).toMatchObject({
      title: 'Articles coming soon',
      description: 'Placeholder article.',
      pathname: '/articles/articles-coming-soon',
      locale: 'en',
      noindex: true,
      ogType: 'article',
      publishedTime: '2026-09-24',
      authors: [{ name: 'SchoolTest Team' }],
      keywords: ['eald', 'assessment'],
    });
    const indexable = { ...page, seo: { ...page.seo, noindex: false } };
    expect(cmsMetadataInput({ page: indexable, requestedLocale: 'en', isFallback: false }).noindex).toBe(false);
    expect(cmsMetadataInput({ page: indexable, requestedLocale: 'zh', isFallback: true }).noindex).toBe(true);
  });

  test('FAQ entries for JSON-LD are exactly the visible FAQ', () => {
    expect(cmsFaqEntries(page)).toEqual([{ key: '3-1', question: 'Is it free?', answer: 'TODO answer.' }]);
  });

  test('RSS escapes content and emits one item per article', () => {
    const xml = buildRssFeed({
      title: 'A & B',
      description: '<desc>',
      language: 'en',
      homePageUrl: 'https://s.test/articles',
      feedUrl: 'https://s.test/articles/feed.xml',
      items: [{ id: 'https://s.test/articles/a', url: 'https://s.test/articles/a', title: 'Tom & "Jerry"', summary: 'x<y', publishedAt: '2026-09-01T00:00:00.000Z', authorName: 'Ada' }],
    });
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    expect(doc.getElementsByTagName('parsererror')).toHaveLength(0);
    expect(doc.querySelector('channel > title')?.textContent).toBe('A & B');
    expect(doc.querySelectorAll('item')).toHaveLength(1);
    expect(doc.querySelector('item > title')?.textContent).toBe('Tom & "Jerry"');
    expect(doc.querySelector('item > pubDate')?.textContent).toBe('Tue, 01 Sep 2026 00:00:00 GMT');
  });
});
