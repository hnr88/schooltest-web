import type { Metadata } from 'next';

import { routing } from '@/i18n/routing';
import { absoluteUrl } from '@/modules/seo/lib/breadcrumb-json-ld';
import {
  OG_IMAGE_HEIGHT,
  OG_IMAGE_PATH,
  OG_IMAGE_WIDTH,
  SITE_NAME,
} from '@/modules/seo/constants/seo.constants';
import type { BuildPageMetadataInput } from '@/modules/seo/types/seo.types';

/** hreflang map: every locale plus `x-default` pointing at the default locale. */
function languageAlternates(pathname: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    languages[locale] = absoluteUrl(pathname, locale, routing.defaultLocale);
  }
  languages['x-default'] = absoluteUrl(pathname, routing.defaultLocale, routing.defaultLocale);
  return languages;
}

/**
 * The ONE metadata builder for public pages (mission task 213). Produces the
 * canonical URL, the full hreflang set, and the Open Graph / Twitter card from
 * a single call, so no page hand-rolls a partial metadata object.
 *
 * The card image is the generated route at `src/app/[locale]/opengraph-image
 * .tsx`, referenced EXPLICITLY: a page that supplies its own `openGraph` block
 * does not get the file-convention image merged in, so relying on the
 * convention alone shipped pages with no og:image at all (caught live).
 * `metadataBase` in the root layout resolves the relative path.
 *
 * `siteName` and the title/description defaults come from the platform
 * settings (C-SET-01) when the caller supplies them; SITE_NAME is the fallback.
 */
export function buildPageMetadata(input: BuildPageMetadataInput): Metadata {
  const {
    title,
    description,
    pathname,
    locale,
    siteName = SITE_NAME,
    ogType = 'website',
    noindex = false,
    publishedTime,
    modifiedTime,
  } = input;

  const canonical = absoluteUrl(pathname, locale, routing.defaultLocale);

  return {
    title,
    description,
    alternates: { canonical, languages: languageAlternates(pathname) },
    openGraph: {
      type: ogType,
      title,
      description,
      url: canonical,
      siteName,
      locale,
      images: [{ url: OG_IMAGE_PATH, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT, alt: title }],
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
    },
    twitter: { card: 'summary_large_image', title, description, images: [OG_IMAGE_PATH] },
    robots: noindex
      ? { index: false, follow: false }
      : { index: true, follow: true, googleBot: { index: true, follow: true } },
  };
}
