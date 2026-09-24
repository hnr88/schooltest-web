import type { OgCmsSource } from '@/modules/seo/types/og.types';

/**
 * The CMS plug point for per-article share cards. Once `@/modules/cms`
 * exports its page reader, this returns the page's title and description
 * (the card copy) for `slug` in `locale`; until then, and for an unknown
 * slug, it returns null and the article card falls back to the articles card.
 * A CMS-authored OG image is not read here: it goes into the page metadata
 * via `buildOgImageSet({ override })`, so the generated card is never fetched.
 */
export async function loadCmsOgSource(slug: string, locale: string): Promise<OgCmsSource | null> {
  void slug;
  void locale;
  return null;
}
