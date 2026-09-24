// @vitest-environment node
import { afterEach, describe, expect, test, vi } from 'vitest';

import { buildMetadata, buildRootMetadata } from '@/modules/seo/lib/build-metadata';
import { clampText, composeDocumentTitle } from '@/modules/seo/lib/seo-text';

const BASE = 'http://localhost:3000';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('buildMetadata', () => {
  const input = {
    title: 'Diagnose EAL/D needs by subskill',
    description: 'Break placement scores into 27 subskill scores.',
    pathname: '/diagnose',
  };

  test('default locale: unprefixed absolute canonical, 6 hreflang + x-default', () => {
    const meta = buildMetadata({ ...input, locale: 'en' });
    expect(meta.alternates?.canonical).toBe(`${BASE}/diagnose`);
    expect(meta.alternates?.languages).toEqual({
      en: `${BASE}/diagnose`,
      zh: `${BASE}/zh/diagnose`,
      ko: `${BASE}/ko/diagnose`,
      ms: `${BASE}/ms/diagnose`,
      vi: `${BASE}/vi/diagnose`,
      th: `${BASE}/th/diagnose`,
      'x-default': `${BASE}/diagnose`,
    });
  });

  test('non-default locale: prefixed canonical, og:url, og:locale and localized card', () => {
    const meta = buildMetadata({ ...input, locale: 'zh' });
    expect(meta.alternates?.canonical).toBe(`${BASE}/zh/diagnose`);
    const og = meta.openGraph as Record<string, unknown>;
    expect(og.url).toBe(`${BASE}/zh/diagnose`);
    expect(og.locale).toBe('zh_CN');
    expect(og.alternateLocale).toEqual(['en_AU', 'ko_KR', 'ms_MY', 'vi_VN', 'th_TH']);
    expect(og.images).toEqual([
      { url: `${BASE}/zh/diagnose/opengraph-image`, width: 1200, height: 630, alt: input.title, type: 'image/png' },
    ]);
    expect((meta.twitter as { images: unknown }).images).toEqual([
      { url: `${BASE}/zh/diagnose/twitter-image`, alt: input.title },
    ]);
  });

  test('title is branded within 60 chars; og:title is the bare page title', () => {
    const meta = buildMetadata({ ...input, locale: 'en' });
    expect(meta.title).toEqual({ absolute: 'Diagnose EAL/D needs by subskill · SchoolTest' });
    expect((meta.openGraph as { title: string }).title).toBe(input.title);
  });

  test('twitter large card and indexable robots with max-* directives', () => {
    const meta = buildMetadata({ ...input, locale: 'en' });
    expect(meta.twitter).toMatchObject({ card: 'summary_large_image', title: input.title });
    expect(meta.robots).toMatchObject({
      index: true,
      follow: true,
      googleBot: { index: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
    });
  });

  test('noindex pages say so', () => {
    expect(buildMetadata({ ...input, locale: 'en', noindex: true }).robots).toMatchObject({
      index: false,
      follow: false,
    });
  });

  test('article type carries published/modified time, authors, section and tags', () => {
    const og = buildMetadata({
      ...input,
      locale: 'en',
      ogType: 'article',
      publishedTime: '2026-09-01',
      modifiedTime: '2026-09-02',
      authors: [{ name: 'Ada', url: 'https://example.test/ada' }],
      section: 'Guides',
      tags: ['eal/d'],
    }).openGraph as Record<string, unknown>;
    expect(og).toMatchObject({
      type: 'article',
      publishedTime: '2026-09-01',
      modifiedTime: '2026-09-02',
      authors: ['https://example.test/ada'],
      section: 'Guides',
      tags: ['eal/d'],
    });
  });

  test('canonicalPath points a duplicate at the original', () => {
    const meta = buildMetadata({ ...input, locale: 'ko', canonicalPath: '/teach' });
    expect(meta.alternates?.canonical).toBe(`${BASE}/ko/teach`);
  });

  test('description is clamped to 160 characters', () => {
    const meta = buildMetadata({ ...input, locale: 'en', description: 'word '.repeat(60) });
    expect((meta.description ?? '').length).toBeLessThanOrEqual(160);
    expect(meta.description?.endsWith('…')).toBe(true);
  });
});

describe('title composition', () => {
  test('drops the brand when the branded title would pass 60 chars', () => {
    const long = 'A fairly long page title about EAL/D assessment!!';
    expect(composeDocumentTitle(long, 'SchoolTest')).toBe(long);
  });
  test('site root keeps its own title unsuffixed', () => {
    expect(composeDocumentTitle('SchoolTest: EAL/D', 'SchoolTest', true)).toBe('SchoolTest: EAL/D');
  });
  test('clampText cuts on a word boundary', () => {
    expect(clampText('alpha beta gamma delta', 15)).toBe('alpha beta…');
  });
});

describe('buildRootMetadata', () => {
  test('site-wide identity without optional env', () => {
    const meta = buildRootMetadata({ locale: 'en', description: 'Desc' });
    expect(meta.metadataBase?.toString()).toBe(`${BASE}/`);
    expect(meta).toMatchObject({
      applicationName: 'SchoolTest',
      publisher: 'SchoolTest',
      category: 'education',
      referrer: 'strict-origin-when-cross-origin',
      formatDetection: { telephone: false, email: false, address: false },
    });
    expect(meta.verification).toBeUndefined();
    expect(meta.facebook).toBeUndefined();
  });

  test('verification, fb:app_id and twitter handles come from env when set', async () => {
    vi.stubEnv('SEO_GOOGLE_SITE_VERIFICATION', 'g-token');
    vi.stubEnv('SEO_BING_SITE_VERIFICATION', 'b-token');
    vi.stubEnv('SEO_YANDEX_VERIFICATION', 'y-token');
    vi.stubEnv('SEO_FACEBOOK_APP_ID', '12345');
    vi.stubEnv('SEO_TWITTER_SITE', '@schooltest');
    vi.resetModules();
    const fresh = await import('@/modules/seo/lib/build-metadata');
    const root = fresh.buildRootMetadata({ locale: 'en', description: 'Desc' });
    expect(root.verification).toEqual({
      google: 'g-token',
      yandex: 'y-token',
      other: { 'msvalidate.01': 'b-token' },
    });
    expect(root.facebook).toEqual({ appId: '12345' });
    const page = fresh.buildMetadata({ title: 'T', description: 'D', pathname: '/', locale: 'en' });
    expect(page.twitter).toMatchObject({ site: '@schooltest', creator: '@schooltest' });
  });
});
