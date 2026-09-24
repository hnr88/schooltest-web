import { describe, expect, it } from 'vitest';

import { buildBreadcrumbJsonLd } from '@/modules/seo/lib/breadcrumb-json-ld';
import {
  buildJsonLdGraph,
  buildOrganizationJsonLd,
  buildWebPageJsonLd,
  buildWebSiteJsonLd,
} from '@/modules/seo/lib/json-ld';
import { pageIds, siteIds } from '@/modules/seo/lib/json-ld-ids';

const SITE = { siteName: 'SchoolTest', description: 'Diagnostic English assessment.' };
const ROOT = 'http://localhost:3000/';

describe('site ids', () => {
  it('anchors Organization/WebSite on the root URL for every locale', () => {
    expect(siteIds()).toMatchObject({
      root: ROOT,
      organization: `${ROOT}#organization`,
      website: `${ROOT}#website`,
      logo: `${ROOT}#logo`,
      software: `${ROOT}#software`,
    });
  });

  it('derives page ids from the locale-prefixed canonical URL', () => {
    expect(pageIds('/diagnose', 'en').webpage).toBe('http://localhost:3000/diagnose#webpage');
    expect(pageIds('/diagnose', 'zh').breadcrumb).toBe('http://localhost:3000/zh/diagnose#breadcrumb');
    expect(pageIds('/', 'ko').url).toBe('http://localhost:3000/ko');
    expect(pageIds('/teach', 'en').question('names')).toBe('http://localhost:3000/teach#faq-names');
  });
});

describe('buildOrganizationJsonLd', () => {
  const org = buildOrganizationJsonLd(SITE);

  it('publishes the real logo as an ImageObject with an @id the image property reuses', () => {
    expect(org['@type']).toBe('Organization');
    expect(org.logo).toMatchObject({
      '@type': 'ImageObject',
      '@id': `${ROOT}#logo`,
      url: `${ROOT}brand/logo.png`,
      width: 503,
      height: 160,
    });
    expect(org.image).toEqual({ '@id': `${ROOT}#logo` });
  });

  it('points the contact point at the enquiry form and serves Australia', () => {
    expect(org.contactPoint?.[0]).toMatchObject({ '@type': 'ContactPoint', url: `${ROOT}#register` });
    expect(org.areaServed).toEqual({ '@type': 'Country', name: 'Australia' });
  });

  it('omits sameAs while no verified profile exists', () => {
    expect('sameAs' in org).toBe(false);
  });
});

describe('buildWebSiteJsonLd', () => {
  it('names its publisher by @id and has no SearchAction (the site has no search page)', () => {
    const site = buildWebSiteJsonLd(SITE);
    expect(site.publisher).toEqual({ '@id': `${ROOT}#organization` });
    expect(site.inLanguage).toEqual(['en', 'zh', 'ko', 'ms', 'vi', 'th']);
    expect('potentialAction' in site).toBe(false);
  });
});

describe('buildWebPageJsonLd', () => {
  const base = { pathname: '/track', locale: 'vi', title: 'Track', description: 'Progress.' };

  it('is a plain WebPage without FAQ, dates, breadcrumb or speakable unless given', () => {
    const page = buildWebPageJsonLd(base);
    expect(page['@type']).toBe('WebPage');
    expect(page.inLanguage).toBe('vi');
    expect(page.isPartOf).toEqual({ '@id': `${ROOT}#website` });
    for (const key of ['datePublished', 'dateModified', 'breadcrumb', 'speakable', 'mainEntity']) {
      expect(key in page, key).toBe(false);
    }
  });

  it('becomes [WebPage, FAQPage] with Question refs as mainEntity when a FAQ is present', () => {
    const page = buildWebPageJsonLd({
      ...base,
      pageType: 'AboutPage',
      questionIds: ['q1', 'q2'],
      hasBreadcrumb: true,
      isSpeakable: true,
      dateModified: '2026-08-31',
      image: { url: 'http://localhost:3000/vi/opengraph-image', width: 1200, height: 630 },
    });
    expect(page['@type']).toEqual(['AboutPage', 'FAQPage']);
    expect(page.mainEntity).toEqual([{ '@id': 'q1' }, { '@id': 'q2' }]);
    expect(page.breadcrumb).toEqual({ '@id': 'http://localhost:3000/vi/track#breadcrumb' });
    expect(page.speakable?.cssSelector).toEqual(['h1', '[data-speakable="summary"]']);
    expect(page.primaryImageOfPage).toMatchObject({ '@type': 'ImageObject', width: 1200, height: 630 });
    expect(page.dateModified).toBe('2026-08-31');
  });
});

describe('buildBreadcrumbJsonLd + buildJsonLdGraph', () => {
  it('numbers crumbs from 1, carries the @id and has no @context of its own', () => {
    const list = buildBreadcrumbJsonLd(
      [
        { name: 'Home', url: ROOT },
        { name: 'Diagnose', url: `${ROOT}diagnose` },
      ],
      `${ROOT}diagnose#breadcrumb`,
    );
    expect(list['@id']).toBe(`${ROOT}diagnose#breadcrumb`);
    expect(list.itemListElement.map((item) => item.position)).toEqual([1, 2]);
    expect('@context' in list).toBe(false);
    expect(buildJsonLdGraph([list])).toEqual({ '@context': 'https://schema.org', '@graph': [list] });
  });
});
