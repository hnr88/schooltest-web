import type { Metadata } from 'next';

import { env } from '@/lib/env';
import { toAbsoluteStrapiMediaUrl } from '@/lib/strapi-media';
import { canonicalPathFrom, cmsPagePath } from '@/modules/cms/lib/cms-paths';
import type { ResolvedCmsPage } from '@/modules/cms/types/cms.types';
import { buildMetadata } from '@/modules/seo';
import type { BuildMetadataInput } from '@/modules/seo';

/**
 * Page SEO component → the site's ONE metadata builder. Empty SEO fields fall
 * back to the page title/summary; a page served as the `en` fallback under
 * another locale is noindex, so English copy is never indexed twice.
 */
export function cmsMetadataInput({ page, requestedLocale, isFallback }: ResolvedCmsPage): BuildMetadataInput {
  const seo = page.seo;
  const image = seo?.ogImage ?? page.coverImage;
  const keywords = (seo?.keywords ?? '')
    .split(',')
    .map((keyword) => keyword.trim())
    .filter(Boolean);
  const isArticle = page.pageType === 'article';
  const canonicalPath = canonicalPathFrom(seo?.canonicalUrl, env.NEXT_PUBLIC_APP_URL);

  return {
    title: seo?.metaTitle || page.title,
    description: seo?.metaDescription || page.summary || page.title,
    pathname: cmsPagePath(page),
    locale: requestedLocale,
    ...(canonicalPath ? { canonicalPath } : {}),
    noindex: Boolean(seo?.noindex) || isFallback,
    ogType: isArticle ? 'article' : 'website',
    ...(page.publishedDate ? { publishedTime: page.publishedDate } : {}),
    modifiedTime: page.updatedDate ?? page.updatedAt,
    ...(image
      ? {
          image: {
            url: toAbsoluteStrapiMediaUrl(image.url),
            alt: image.alternativeText || page.title,
            ...(image.width ? { width: image.width } : {}),
            ...(image.height ? { height: image.height } : {}),
            ...(image.mime ? { type: image.mime } : {}),
          },
        }
      : {}),
    ...(isArticle && page.author ? { authors: [{ name: page.author.name, ...(page.author.url ? { url: page.author.url } : {}) }] } : {}),
    ...(keywords.length ? { keywords } : {}),
  };
}

export function buildCmsMetadata(resolved: ResolvedCmsPage | null): Metadata {
  return resolved ? buildMetadata(cmsMetadataInput(resolved)) : {};
}
