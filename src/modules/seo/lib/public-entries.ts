import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { PUBLIC_ROUTES, isDisallowed } from '@/modules/seo/constants/public-routes';
import { buildMetadata } from '@/modules/seo/lib/build-metadata';
import { loadCmsContent } from '@/modules/seo/lib/cms-content';
import type {
  PublicContentInput,
  PublicEntry,
  PublicPageMetadataInput,
} from '@/modules/seo/types/metadata.types';

/**
 * Metadata for a registry page, with its search title and description read
 * from `Seo.pages.<seoKey>` in the page's own locale, so a marketing page
 * cannot ship without a localised, length-checked title.
 */
export async function buildPublicPageMetadata({
  pathname,
  locale,
  siteName,
}: PublicPageMetadataInput): Promise<Metadata> {
  const route = PUBLIC_ROUTES.find((entry) => entry.pathname === pathname);
  if (!route) throw new Error(`[seo] ${pathname} is not in PUBLIC_ROUTES`);
  const t = await getTranslations({ locale, namespace: 'Seo.pages' });
  return buildMetadata({
    title: t(`${route.seoKey}.title`),
    description: t(`${route.seoKey}.description`),
    pathname,
    locale,
    siteName,
    isSiteRoot: pathname === '/',
  });
}

/**
 * Runs a content source and degrades to an empty list when it is unreachable:
 * the sitemap and llms.txt must still list the static registry when the API or
 * the CMS is down, instead of answering 500 to every crawler.
 */
export async function loadOrEmpty<T>(label: string, load: () => Promise<readonly T[]>): Promise<readonly T[]> {
  try {
    return await load();
  } catch (error) {
    console.warn(`[seo] ${label} unavailable; serving the static registry only`, error);
    return [];
  }
}

const SECTION_DEFAULTS = {
  pages: { changeFrequency: 'monthly', priority: 0.7 },
  articles: { changeFrequency: 'monthly', priority: 0.6 },
  legal: { changeFrequency: 'yearly', priority: 0.4 },
} as const;

/**
 * Every indexable URL for one locale: the static registry and the CMS pages
 * (legal, info, articles) — one list the sitemap,
 * llms.txt and llms-full.txt all consume. A CMS record that shares a pathname
 * with the registry replaces it.
 */
export async function getPublicEntries({
  locale,
  withBody = false,
}: {
  locale: string;
  withBody?: boolean;
}): Promise<PublicEntry[]> {
  const t = await getTranslations({ locale, namespace: 'Seo.pages' });
  const byPath = new Map<string, PublicEntry>();

  for (const route of PUBLIC_ROUTES) {
    byPath.set(route.pathname, {
      pathname: route.pathname,
      title: t(`${route.seoKey}.title`),
      description: t(`${route.seoKey}.description`),
      lastModified: route.lastModified,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      section: 'pages',
    });
  }

  const cms = await loadOrEmpty('CMS content', () => loadCmsContent(locale, withBody));
  for (const item of cms) {
    const existing = byPath.get(item.pathname);
    byPath.set(item.pathname, {
      ...SECTION_DEFAULTS[item.section],
      ...(existing ? { changeFrequency: existing.changeFrequency, priority: existing.priority } : {}),
      pathname: item.pathname,
      title: item.title,
      description: item.description,
      lastModified: item.updatedAt,
      section: item.section,
      ...(item.body ? { body: item.body } : {}),
      ...(item.images?.length ? { images: item.images } : {}),
      ...(item.locales?.length ? { locales: item.locales } : {}),
    });
  }

  return [...byPath.values()].filter((entry) => !isDisallowed(entry.pathname));
}
