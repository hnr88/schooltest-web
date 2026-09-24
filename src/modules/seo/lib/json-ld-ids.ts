import { routing } from '@/i18n/routing';
import { JSON_LD_FRAGMENT } from '@/modules/seo/constants/json-ld.constants';
import { absoluteUrl } from '@/modules/seo/lib/breadcrumb-json-ld';
import type { PageIds, SiteIds } from '@/modules/seo/types/json-ld-input.types';

/** Site-level @ids: one Organization/WebSite/app for every locale, anchored on the root URL. */
export function siteIds(): SiteIds {
  const root = absoluteUrl('/', routing.defaultLocale, routing.defaultLocale);
  return {
    root,
    organization: `${root}${JSON_LD_FRAGMENT.organization}`,
    website: `${root}${JSON_LD_FRAGMENT.website}`,
    logo: `${root}${JSON_LD_FRAGMENT.logo}`,
    software: `${root}${JSON_LD_FRAGMENT.software}`,
  };
}

/** Page-level @ids: derived from the page's own locale-specific canonical URL. */
export function pageIds(pathname: string, locale: string): PageIds {
  const url = absoluteUrl(pathname, locale, routing.defaultLocale);
  return {
    url,
    webpage: `${url}${JSON_LD_FRAGMENT.webpage}`,
    breadcrumb: `${url}${JSON_LD_FRAGMENT.breadcrumb}`,
    primaryImage: `${url}${JSON_LD_FRAGMENT.primaryImage}`,
    service: `${url}${JSON_LD_FRAGMENT.service}`,
    howTo: `${url}${JSON_LD_FRAGMENT.howTo}`,
    article: `${url}${JSON_LD_FRAGMENT.article}`,
    question: (key: string) => `${url}#faq-${key}`,
  };
}
