import { ARTICLES_PATH } from '@/modules/cms/constants/cms.constants';
import type { CmsPageSummary } from '@/modules/cms/types/cms.types';

/** Locale-less public path of a CMS page: articles under /articles, everything else at the root. */
export function cmsPagePath(page: Pick<CmsPageSummary, 'slug' | 'pageType'>): string {
  return page.pageType === 'article' ? `${ARTICLES_PATH}/${page.slug}` : `/${page.slug}`;
}

export function isExternalHref(href: string): boolean {
  return /^(?:https?:|mailto:|tel:)/i.test(href);
}

/**
 * An editor's canonical override as a locale-less path. Accepts a site path
 * (`/privacy-policy`) or an absolute URL on the site's own origin; anything
 * else is ignored (a cross-domain canonical is not something this site
 * issues), so a typo can never de-index the page.
 */
export function canonicalPathFrom(value: string | null | undefined, siteOrigin: string): string | undefined {
  if (!value) return undefined;
  if (value.startsWith('/') && !value.startsWith('//')) return value;
  try {
    const url = new URL(value);
    return url.origin === new URL(siteOrigin).origin ? url.pathname : undefined;
  } catch {
    return undefined;
  }
}
