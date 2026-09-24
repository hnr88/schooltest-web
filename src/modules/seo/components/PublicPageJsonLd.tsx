import { getTranslations } from 'next-intl/server';

import { routing } from '@/i18n/routing';
import { JsonLd } from '@/modules/seo/components/JsonLd';
import {
  OG_IMAGE_HEIGHT,
  OG_IMAGE_PATH,
  OG_IMAGE_WIDTH,
  SITE_NAME,
} from '@/modules/seo/constants/seo.constants';
import { absoluteUrl } from '@/modules/seo/lib/breadcrumb-json-ld';
import { buildPublicPageGraph } from '@/modules/seo/lib/public-page-graph';
import { resolveBreadcrumbItems } from '@/modules/seo/lib/resolve-breadcrumb';

import type { PublicPageJsonLdProps } from '@/modules/seo/types/components.types';

// Server Component. Emits ONE @graph for a public page: Organization, WebSite,
// WebPage (typed per page, FAQPage when a visible FAQ is passed), BreadcrumbList,
// the FAQ's Question nodes and any page-specific nodes, all linked by @id.
async function PublicPageJsonLd({
  pathname,
  locale,
  title,
  description,
  datePublished,
  dateModified,
  pageType,
  breadcrumb,
  faq,
  nodes,
  aboutId,
  image,
  isSpeakable = false,
}: PublicPageJsonLdProps) {
  const t = await getTranslations({ locale });
  const labels = typeof breadcrumb === 'object' ? breadcrumb : {};
  const trail = breadcrumb
    ? resolveBreadcrumbItems({ pathname, locale, translate: (key) => t(key), ...labels })
    : undefined;

  const graph = buildPublicPageGraph({
    site: { siteName: SITE_NAME, description: t('Landing.footer.tagline') },
    page: {
      pathname,
      locale,
      title,
      description,
      pageType,
      datePublished,
      dateModified,
      isSpeakable,
      image: image ?? {
        url: absoluteUrl(OG_IMAGE_PATH, locale, routing.defaultLocale),
        width: OG_IMAGE_WIDTH,
        height: OG_IMAGE_HEIGHT,
        caption: title,
      },
    },
    breadcrumb: trail,
    faq,
    nodes,
    aboutId,
  });

  return <JsonLd data={graph} />;
}

export { PublicPageJsonLd };
