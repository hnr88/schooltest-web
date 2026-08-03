import { env } from '@/lib/env';
import type { BreadcrumbJsonLdItem, JsonLdNode } from '@/modules/seo/types/seo.types';

/**
 * Absolute URL for a locale-less app path. `localePrefix: 'as-needed'` means the
 * default locale carries no prefix, so the canonical URL for `en` is the bare
 * path — the same URL the visible `<Link>` resolves to.
 */
export function absoluteUrl(pathname: string, locale: string, defaultLocale: string): string {
  const prefix = locale === defaultLocale ? '' : `/${locale}`;
  const path = `${prefix}${pathname === '/' ? '' : pathname}` || '/';
  return new URL(path, env.NEXT_PUBLIC_APP_URL).toString();
}

/**
 * schema.org BreadcrumbList built from the SAME trail the UI renders, so the
 * structured data can never disagree with the visible crumbs (mission task 211).
 */
export function buildBreadcrumbJsonLd(items: readonly BreadcrumbJsonLdItem[]): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
