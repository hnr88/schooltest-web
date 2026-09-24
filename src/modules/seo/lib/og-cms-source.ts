import { getCmsPage } from '@/modules/cms';
import type { OgCmsSource } from '@/modules/seo/types/og.types';

/**
 * The card copy for a CMS article: its title and summary (the SEO component's
 * meta fields when the summary is empty). Null for an unknown slug, a
 * non-article page, or an unreachable CMS, so the route falls back to the
 * articles card. A CMS-authored OG image is not read here: it reaches the page
 * metadata as the builder's `image`, so the generated card is never fetched.
 */
export async function loadCmsOgSource(slug: string, locale: string): Promise<OgCmsSource | null> {
  const resolved = await getCmsPage(slug, locale).catch(() => null);
  if (!resolved || resolved.page.pageType !== 'article') return null;
  const { page } = resolved;
  return { title: page.title, description: page.summary || page.seo?.metaDescription || null };
}
