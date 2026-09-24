import { ImageResponse } from 'next/og';
import { getTranslations } from 'next-intl/server';

import { isLocale, routing } from '@/i18n/routing';
import { OgCard } from '@/modules/seo/components/OgCard';
import { OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH, SITE_NAME } from '@/modules/seo/constants/seo.constants';
import {
  OG_ARTICLE_EYEBROW_KEY,
  OG_CACHE_CONTROL,
  OG_CARD_COPY,
  OG_CJK_FONT_FAMILY,
  OG_EYEBROW_SEPARATOR,
  OG_FONT_FAMILY,
  OG_SCRIPT_LANG,
  OG_KEEP_ALL_LOCALES,
  OG_TAGLINE_KEY,
  OG_TAGLINE_MAX_UNITS,
  OG_TITLE_MAX_UNITS,
  OG_TRACKED_LOCALES,
} from '@/modules/seo/constants/og.constants';
import { loadCmsOgSource } from '@/modules/seo/lib/og-cms-source';
import { loadOgFonts } from '@/modules/seo/lib/og-fonts';
import { ogCardPathname } from '@/modules/seo/lib/og-image-url';
import { ogMarkDataUri, ogTitleFontSize, prepareOgText } from '@/modules/seo/lib/og-text';
import type { OgCardInput } from '@/modules/seo/types/og.types';

const EYEBROW_MAX_UNITS = 60;

export function resolveOgLocale(locale: string): string {
  return isLocale(locale) ? locale : routing.defaultLocale;
}

/**
 * Renders the branded 1200x630 PNG card from plain copy. It knows nothing
 * about where the copy came from: product pages, CMS articles and CMS pages
 * all call this with `{ title, eyebrow, locale }`.
 */
export async function renderOgCard(input: OgCardInput): Promise<ImageResponse> {
  const locale = resolveOgLocale(input.locale);
  const tagline = input.tagline ?? (await getTranslations({ locale }))(OG_TAGLINE_KEY);
  const title = prepareOgText(input.title, OG_TITLE_MAX_UNITS);
  const eyebrow = prepareOgText(input.eyebrow, EYEBROW_MAX_UNITS);
  const line = prepareOgText(tagline, OG_TAGLINE_MAX_UNITS);
  const fonts = await loadOgFonts(locale, { bold: `${SITE_NAME}${eyebrow}${title}`, regular: line });

  return new ImageResponse(
    <OgCard
      siteName={SITE_NAME}
      eyebrow={eyebrow}
      title={title}
      tagline={line}
      titleSize={ogTitleFontSize(title)}
      lang={OG_SCRIPT_LANG[locale]}
      fontFamily={`'${OG_FONT_FAMILY}', '${OG_CJK_FONT_FAMILY}'`}
      markSrc={ogMarkDataUri('tile')}
      watermarkSrc={ogMarkDataUri('glyph')}
      isTracked={OG_TRACKED_LOCALES.includes(locale)}
      isKeepAll={OG_KEEP_ALL_LOCALES.includes(locale)}
    />,
    {
      width: OG_IMAGE_WIDTH,
      height: OG_IMAGE_HEIGHT,
      fonts: [...fonts],
      headers: { 'Cache-Control': OG_CACHE_CONTROL },
    },
  );
}

/** The card for a public page whose copy lives in the message files. */
export async function renderOgCardForPath(pathname: string, locale: string): Promise<ImageResponse> {
  const resolved = resolveOgLocale(locale);
  const copy = OG_CARD_COPY[ogCardPathname(pathname)] ?? OG_CARD_COPY['/'];
  const t = await getTranslations({ locale: resolved });
  const eyebrow = t(copy.eyebrowKey);
  return renderOgCard({
    title: t(copy.titleKey),
    eyebrow: copy.isEyebrowFirstPart ? eyebrow.split(OG_EYEBROW_SEPARATOR)[0] : eyebrow,
    locale: resolved,
  });
}

/** A CMS article's card: its title, the localised "Article" eyebrow, its description. */
export async function renderOgCardForArticle(slug: string, locale: string): Promise<ImageResponse> {
  const resolved = resolveOgLocale(locale);
  const source = await loadCmsOgSource(slug, resolved);
  if (!source) return renderOgCardForPath('/articles', resolved);
  const t = await getTranslations({ locale: resolved });
  return renderOgCard({
    title: source.title,
    eyebrow: t(OG_ARTICLE_EYEBROW_KEY),
    locale: resolved,
    ...(source.description ? { tagline: source.description } : {}),
  });
}

export function ogStaticParams(): { locale: string }[] {
  return routing.locales.map((locale) => ({ locale }));
}
