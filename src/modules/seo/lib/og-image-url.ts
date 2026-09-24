import { routing } from '@/i18n/routing';
import { env } from '@/lib/env';
import { OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH } from '@/modules/seo/constants/seo.constants';
import {
  OG_ARTICLE_PREFIX,
  OG_CARD_PATHNAMES,
  OG_CONTENT_TYPE,
  OG_IMAGE_SEGMENT,
  TWITTER_IMAGE_SEGMENT,
} from '@/modules/seo/constants/og.constants';
import type {
  OgImageDescriptor,
  OgImageOverride,
  OgImageSet,
} from '@/modules/seo/types/og.types';

/** The pathname whose card route serves `pathname`: its own, else the locale root card. */
export function ogCardPathname(pathname: string): string {
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  if (OG_CARD_PATHNAMES.includes(clean)) return clean;
  const slug = clean.startsWith(OG_ARTICLE_PREFIX) ? clean.slice(OG_ARTICLE_PREFIX.length) : '';
  return slug && !slug.includes('/') ? clean : '/';
}

/** Locale-prefixed (`as-needed`) path of a page's generated card or twitter image. */
export function ogImagePathFor(
  pathname: string,
  locale: string,
  segment: string = OG_IMAGE_SEGMENT,
): string {
  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;
  const card = ogCardPathname(pathname);
  return `${prefix}${card === '/' ? '' : card}/${segment}`;
}

function describe(url: string, alt: string, override?: OgImageOverride): OgImageDescriptor {
  const absolute = new URL(url, env.NEXT_PUBLIC_APP_URL);
  return {
    url: absolute.toString(),
    ...(absolute.protocol === 'https:' ? { secureUrl: absolute.toString() } : {}),
    ...(override
      ? { ...(override.width ? { width: override.width } : {}), ...(override.height ? { height: override.height } : {}) }
      : { width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT }),
    ...(override ? (override.type ? { type: override.type } : {}) : { type: OG_CONTENT_TYPE }),
    alt: override?.alt ?? alt,
  };
}

/**
 * The `og:image` and `twitter:image` entries for a page, with url, secure_url,
 * width, height, type and alt. A CMS-authored image (`override`) wins; without
 * one the page points at its generated card routes.
 */
export function buildOgImageSet(input: {
  pathname: string;
  locale: string;
  alt: string;
  override?: OgImageOverride | null;
}): OgImageSet {
  const { pathname, locale, alt, override } = input;
  if (override?.url) {
    const image = describe(override.url, alt, override);
    return { openGraph: image, twitter: image };
  }
  return {
    openGraph: describe(ogImagePathFor(pathname, locale, OG_IMAGE_SEGMENT), alt),
    twitter: describe(ogImagePathFor(pathname, locale, TWITTER_IMAGE_SEGMENT), alt),
  };
}
