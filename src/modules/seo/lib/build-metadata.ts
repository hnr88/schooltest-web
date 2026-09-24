import type { Metadata } from 'next';

import { routing } from '@/i18n/routing';
import { env } from '@/lib/env';
import { absoluteUrl } from '@/modules/seo/lib/breadcrumb-json-ld';
import { buildOgImageSet } from '@/modules/seo/lib/og-image-url';
import { clampDescription, clampText, composeDocumentTitle } from '@/modules/seo/lib/seo-text';
import {
  INDEX_ROBOTS,
  NOINDEX_ROBOTS,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_PATH,
  OG_IMAGE_WIDTH,
  OG_LOCALES,
  SITE_CATEGORY,
  SITE_NAME,
  TITLE_MAX_LENGTH,
} from '@/modules/seo/constants/seo.constants';
import type { BuildMetadataInput } from '@/modules/seo/types/metadata.types';

/** hreflang map: every published locale plus `x-default` (the default locale when present). */
export function languageAlternates(
  pathname: string,
  locales: readonly string[] = routing.locales,
): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    languages[locale] = absoluteUrl(pathname, locale, routing.defaultLocale);
  }
  const fallback = locales.includes(routing.defaultLocale) ? routing.defaultLocale : locales[0];
  if (fallback) languages['x-default'] = absoluteUrl(pathname, fallback, routing.defaultLocale);
  return languages;
}

/** The generated card for a locale — `as-needed` routing leaves the default unprefixed. */
export function ogImagePath(locale: string): string {
  return locale === routing.defaultLocale ? OG_IMAGE_PATH : `/${locale}${OG_IMAGE_PATH}`;
}

function ogLocale(locale: string): string {
  return OG_LOCALES[locale] ?? locale;
}

function twitterHandles(): { site?: string; creator?: string } {
  const site = env.SEO_TWITTER_SITE;
  const creator = env.SEO_TWITTER_CREATOR ?? site;
  return { ...(site ? { site } : {}), ...(creator ? { creator } : {}) };
}

/**
 * The ONE metadata builder for public pages. From a single call it produces
 * the 60-char `<title>`, the 160-char description, the locale-correct absolute
 * canonical, the full hreflang set with x-default, Open Graph (which LinkedIn,
 * Facebook, Slack and WhatsApp all read), the Twitter/X large card and the
 * robots directives.
 *
 * The card image is referenced EXPLICITLY: a page that supplies its own
 * `openGraph` block does not get the file-convention image merged in.
 * `metadataBase` in the root layout resolves the relative image path.
 */
export function buildMetadata(input: BuildMetadataInput): Metadata {
  const {
    title,
    description,
    pathname,
    locale,
    siteName = SITE_NAME,
    canonicalPath,
    ogType = 'website',
    noindex = false,
    publishedTime,
    modifiedTime,
    isSiteRoot = false,
    image,
    authors,
    section,
    tags,
    keywords,
    alternateLocales = routing.locales,
  } = input;

  // A duplicate route points its canonical at the original; hreflang still
  // describes the ORIGINAL's locale set, never the duplicate's.
  const canonicalTarget = canonicalPath ?? pathname;
  const canonical = absoluteUrl(canonicalTarget, locale, routing.defaultLocale);
  const pageTitle = clampText(title, TITLE_MAX_LENGTH);
  const summary = clampDescription(description);
  const cards = buildOgImageSet({ pathname, locale, alt: pageTitle, override: image ?? null });

  const sharedOpenGraph = {
    title: pageTitle,
    description: summary,
    url: canonical,
    siteName,
    locale: ogLocale(locale),
    alternateLocale: alternateLocales.filter((l) => l !== locale).map(ogLocale),
    images: [cards.openGraph],
  };

  return {
    title: { absolute: composeDocumentTitle(title, siteName, isSiteRoot) },
    description: summary,
    ...(keywords?.length ? { keywords: [...keywords] } : {}),
    ...(authors?.length ? { authors: authors.map((a) => ({ ...a })) } : {}),
    category: SITE_CATEGORY,
    alternates: { canonical, languages: languageAlternates(canonicalTarget, alternateLocales) },
    openGraph:
      ogType === 'article'
        ? {
            ...sharedOpenGraph,
            type: 'article',
            ...(publishedTime ? { publishedTime } : {}),
            ...(modifiedTime ? { modifiedTime } : {}),
            ...(authors?.length ? { authors: authors.map((a) => a.url ?? a.name) } : {}),
            ...(section ? { section } : {}),
            ...(tags?.length ? { tags: [...tags] } : {}),
          }
        : { ...sharedOpenGraph, type: 'website' },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: summary,
      images: [{ url: cards.twitter.url, alt: cards.twitter.alt }],
      ...twitterHandles(),
    },
    robots: noindex ? NOINDEX_ROBOTS : INDEX_ROBOTS,
  };
}

/** Kept for existing callers; identical to `buildMetadata`. */
export const buildPageMetadata = buildMetadata;

function verification(): Metadata['verification'] {
  const other: Record<string, string> = {};
  if (env.SEO_BING_SITE_VERIFICATION) other['msvalidate.01'] = env.SEO_BING_SITE_VERIFICATION;
  const result = {
    ...(env.SEO_GOOGLE_SITE_VERIFICATION ? { google: env.SEO_GOOGLE_SITE_VERIFICATION } : {}),
    ...(env.SEO_YANDEX_VERIFICATION ? { yandex: env.SEO_YANDEX_VERIFICATION } : {}),
    ...(Object.keys(other).length ? { other } : {}),
  };
  return Object.keys(result).length ? result : undefined;
}

/**
 * Site-wide metadata for the `[locale]` root layout: the defaults every page
 * inherits (private pages included) plus the identity tags that only belong
 * once — verification, publisher, fb:app_id, format detection, referrer.
 */
export function buildRootMetadata({
  locale,
  description,
}: {
  locale: string;
  description: string;
}): Metadata {
  const home = absoluteUrl('/', routing.defaultLocale, routing.defaultLocale);
  const verify = verification();
  return {
    metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
    applicationName: SITE_NAME,
    title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
    description: clampDescription(description),
    authors: [{ name: SITE_NAME, url: home }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    category: SITE_CATEGORY,
    referrer: 'strict-origin-when-cross-origin',
    formatDetection: { telephone: false, email: false, address: false },
    ...(verify ? { verification: verify } : {}),
    ...(env.SEO_FACEBOOK_APP_ID ? { facebook: { appId: env.SEO_FACEBOOK_APP_ID } } : {}),
    openGraph: {
      type: 'website',
      url: absoluteUrl('/', locale, routing.defaultLocale),
      siteName: SITE_NAME,
      title: SITE_NAME,
      description: clampDescription(description),
      locale: ogLocale(locale),
      images: [
        {
          url: ogImagePath(locale),
          width: OG_IMAGE_WIDTH,
          height: OG_IMAGE_HEIGHT,
          alt: SITE_NAME,
          type: 'image/png',
        },
      ],
    },
    twitter: { card: 'summary_large_image', ...twitterHandles() },
  };
}
