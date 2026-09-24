import { routing } from '@/i18n/routing';
import {
  AREA_SERVED,
  AREA_SERVED_CODE,
  CONTACT_ANCHOR,
  ORGANIZATION_SAME_AS,
  SPEAKABLE_SELECTORS,
} from '@/modules/seo/constants/json-ld.constants';
import { LOGO_HEIGHT, LOGO_PATH, LOGO_WIDTH, SITE_NAME } from '@/modules/seo/constants/seo.constants';
import { absoluteUrl } from '@/modules/seo/lib/breadcrumb-json-ld';
import { pageIds, siteIds } from '@/modules/seo/lib/json-ld-ids';
import type { PageNodeInput, SiteNodeInput } from '@/modules/seo/types/json-ld-input.types';
import type {
  GraphNode,
  JsonLdGraph,
  OrganizationNode,
  WebPageNode,
  WebPageType,
  WebSiteNode,
} from '@/modules/seo/types/json-ld.types';

/**
 * schema.org Organization for the publisher. Only facts the repository can
 * stand behind: name, root URL, the real logo asset, the tagline, and the
 * enquiry route every landing footer links to. `sameAs` is emitted only once a
 * verified profile is listed in ORGANIZATION_SAME_AS.
 */
export function buildOrganizationJsonLd({ siteName, description }: SiteNodeInput): OrganizationNode {
  const ids = siteIds();
  return {
    '@type': 'Organization',
    '@id': ids.organization,
    name: siteName,
    url: ids.root,
    description,
    logo: {
      '@type': 'ImageObject',
      '@id': ids.logo,
      url: absoluteUrl(LOGO_PATH, routing.defaultLocale, routing.defaultLocale),
      contentUrl: absoluteUrl(LOGO_PATH, routing.defaultLocale, routing.defaultLocale),
      width: LOGO_WIDTH,
      height: LOGO_HEIGHT,
      caption: siteName,
    },
    image: { '@id': ids.logo },
    areaServed: { '@type': 'Country', name: AREA_SERVED },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        url: `${ids.root}${CONTACT_ANCHOR}`,
        areaServed: AREA_SERVED_CODE,
      },
    ],
    ...(ORGANIZATION_SAME_AS.length > 0 ? { sameAs: ORGANIZATION_SAME_AS } : {}),
  };
}

/** schema.org WebSite. No SearchAction: the public site has no search results page. */
export function buildWebSiteJsonLd({ siteName, description }: SiteNodeInput): WebSiteNode {
  const ids = siteIds();
  return {
    '@type': 'WebSite',
    '@id': ids.website,
    name: siteName,
    url: ids.root,
    description,
    inLanguage: [...routing.locales],
    publisher: { '@id': ids.organization },
  };
}

function pageTypeOf(pageType: WebPageType, hasFaq: boolean): WebPageType | readonly WebPageType[] {
  if (!hasFaq || pageType === 'FAQPage') return pageType;
  return [pageType, 'FAQPage'];
}

/**
 * The page node. A page with a visible FAQ becomes `[WebPage, FAQPage]` and
 * lists its Question nodes as `mainEntity`; dates are emitted only when real.
 */
export function buildWebPageJsonLd(input: PageNodeInput): WebPageNode {
  const site = siteIds();
  const ids = pageIds(input.pathname, input.locale);
  const questionIds = input.questionIds ?? [];
  return {
    '@type': pageTypeOf(input.pageType ?? 'WebPage', questionIds.length > 0),
    '@id': ids.webpage,
    url: ids.url,
    name: input.title,
    description: input.description,
    inLanguage: input.locale,
    isPartOf: { '@id': site.website },
    publisher: { '@id': site.organization },
    ...(input.image
      ? {
          primaryImageOfPage: {
            '@type': 'ImageObject',
            '@id': ids.primaryImage,
            url: input.image.url,
            contentUrl: input.image.url,
            ...(input.image.width ? { width: input.image.width } : {}),
            ...(input.image.height ? { height: input.image.height } : {}),
            ...(input.image.caption ? { caption: input.image.caption } : {}),
          },
        }
      : {}),
    ...(input.hasBreadcrumb ? { breadcrumb: { '@id': ids.breadcrumb } } : {}),
    ...(input.aboutId ? { about: { '@id': input.aboutId } } : {}),
    ...(questionIds.length > 0 ? { mainEntity: questionIds.map((id) => ({ '@id': id })) } : {}),
    ...(input.isSpeakable
      ? { speakable: { '@type': 'SpeakableSpecification', cssSelector: SPEAKABLE_SELECTORS } }
      : {}),
    ...(input.datePublished ? { datePublished: input.datePublished } : {}),
    ...(input.dateModified ? { dateModified: input.dateModified } : {}),
  };
}

/** Wraps a page's nodes in ONE @graph so crawlers read a single connected document. */
export function buildJsonLdGraph(nodes: readonly GraphNode[]): JsonLdGraph {
  return { '@context': 'https://schema.org', '@graph': nodes };
}

export { SITE_NAME };
