import { routing } from '@/i18n/routing';
import { absoluteUrl } from '@/modules/seo/lib/breadcrumb-json-ld';
import { LOGO_HEIGHT, LOGO_PATH, LOGO_WIDTH, SITE_NAME } from '@/modules/seo/constants/seo.constants';
import type { JsonLdNode, OrganizationInput, WebPageInput } from '@/modules/seo/types/seo.types';

const SCHEMA = 'https://schema.org';

/**
 * schema.org Organization for the publisher. Only facts this repository can
 * actually stand behind are emitted: name, canonical URL, the real logo asset
 * and the site tagline. No `sameAs` block — the product has no verified social
 * profiles, and inventing them would put false identifiers in structured data.
 */
export function buildOrganizationJsonLd({ siteName, description, locale }: OrganizationInput): JsonLdNode {
  const home = absoluteUrl('/', locale, routing.defaultLocale);
  return {
    '@context': SCHEMA,
    '@type': 'Organization',
    '@id': `${home}#organization`,
    name: siteName,
    url: home,
    description,
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl(LOGO_PATH, routing.defaultLocale, routing.defaultLocale),
      width: LOGO_WIDTH,
      height: LOGO_HEIGHT,
    },
    areaServed: { '@type': 'Country', name: 'Australia' },
  };
}

/** schema.org WebSite for the site root, linked to the Organization publisher. */
export function buildWebSiteJsonLd({ siteName, description, locale }: OrganizationInput): JsonLdNode {
  const home = absoluteUrl('/', locale, routing.defaultLocale);
  return {
    '@context': SCHEMA,
    '@type': 'WebSite',
    '@id': `${home}#website`,
    name: siteName,
    url: home,
    description,
    inLanguage: [...routing.locales],
    publisher: { '@id': `${home}#organization` },
  };
}

/**
 * schema.org WebPage for a single public page. `datePublished`/`dateModified`
 * are emitted only when the caller has a real value (legal documents do).
 */
export function buildWebPageJsonLd({
  title,
  description,
  pathname,
  locale,
  datePublished,
  dateModified,
}: WebPageInput): JsonLdNode {
  const home = absoluteUrl('/', locale, routing.defaultLocale);
  const url = absoluteUrl(pathname, locale, routing.defaultLocale);
  return {
    '@context': SCHEMA,
    '@type': 'WebPage',
    '@id': `${url}#webpage`,
    name: title,
    description,
    url,
    inLanguage: locale,
    isPartOf: { '@id': `${home}#website` },
    publisher: { '@id': `${home}#organization` },
    ...(datePublished ? { datePublished } : {}),
    ...(dateModified ? { dateModified } : {}),
  };
}

export { SITE_NAME };
