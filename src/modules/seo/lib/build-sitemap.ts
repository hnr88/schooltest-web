import type { MetadataRoute } from 'next';

import { routing } from '@/i18n/routing';
import { absoluteUrl } from '@/modules/seo/lib/breadcrumb-json-ld';
import { languageAlternates } from '@/modules/seo/lib/build-metadata';
import { OG_IMAGE_PATH } from '@/modules/seo/constants/seo.constants';
import type { PublicEntry } from '@/modules/seo/types/metadata.types';

/** The sitemap protocol's hard cap per file; past it the sitemap must be split. */
export const SITEMAP_MAX_URLS = 50_000;

/**
 * One `<url>` per public entry x published locale, each with the full
 * `xhtml:link` hreflang set, the entry's real last-modified date and its
 * social card (plus any content images) as image-sitemap entries.
 */
export function buildSitemapEntries(entries: readonly PublicEntry[]): MetadataRoute.Sitemap {
  const urls = entries.flatMap((entry) => {
    const locales = entry.locales ?? routing.locales;
    const languages = languageAlternates(entry.pathname, locales);
    return locales.map((locale) => ({
      url: absoluteUrl(entry.pathname, locale, routing.defaultLocale),
      lastModified: new Date(entry.lastModified),
      changeFrequency: entry.changeFrequency,
      priority: entry.priority,
      alternates: { languages },
      images: [
        absoluteUrl(OG_IMAGE_PATH, locale, routing.defaultLocale),
        ...(entry.images ?? []),
      ],
    }));
  });
  if (urls.length > SITEMAP_MAX_URLS) {
    throw new Error(`[seo] sitemap has ${urls.length} URLs; split it with generateSitemaps`);
  }
  return urls;
}
