import type { PublicContentInput } from '@/modules/seo/types/metadata.types';

/**
 * The CMS plug point for the sitemap, llms.txt and llms-full.txt. Once
 * `listPublicCmsPages()` ships from `@/modules/cms`, this returns its records
 * mapped to `PublicContentInput`; until then the static registry stands alone.
 * Callers wrap it in `loadOrEmpty`, so an unreachable CMS degrades to the
 * registry instead of failing the crawl.
 */
export async function loadCmsContent(locale: string): Promise<readonly PublicContentInput[]> {
  void locale;
  return [];
}
