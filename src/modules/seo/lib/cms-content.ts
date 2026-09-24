import { listPublicCmsPages } from '@/modules/cms';
import type { PublicContentInput } from '@/modules/seo/types/metadata.types';

/**
 * The CMS source for the sitemap, llms.txt and llms-full.txt: every indexable
 * published CMS page (legal, info, articles) in `locale`, with the plain-text
 * body when `withBody` is set. `listPublicCmsPages` already returns [] when the
 * CMS is unreachable; callers still wrap this in `loadOrEmpty`.
 */
export async function loadCmsContent(locale: string, withBody = false): Promise<readonly PublicContentInput[]> {
  return listPublicCmsPages(locale, { withBody });
}
