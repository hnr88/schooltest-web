import { getTranslations } from 'next-intl/server';

import { ARTICLES_PATH, listPublicCmsPages } from '@/modules/cms';
import { ARTICLES_INDEX_LAST_MODIFIED } from '@/modules/seo/constants/public-routes';
import type { PublicContentInput } from '@/modules/seo/types/metadata.types';

/**
 * The CMS source for the sitemap, llms.txt and llms-full.txt: the /articles
 * index (public and indexable in every locale, even before the first article
 * ships) plus every indexable published CMS page (legal, info, articles) in
 * `locale`, with the plain-text body when `withBody` is set.
 * `listPublicCmsPages` already returns [] when the CMS is unreachable; callers
 * still wrap this in `loadOrEmpty`.
 */
export async function loadCmsContent(locale: string, withBody = false): Promise<readonly PublicContentInput[]> {
  const [pages, t] = await Promise.all([
    listPublicCmsPages(locale, { withBody }),
    getTranslations({ locale, namespace: 'Cms' }),
  ]);
  const newestArticle = pages
    .filter((page) => page.section === 'articles')
    .map((page) => page.updatedAt)
    .sort()
    .at(-1);
  const index: PublicContentInput = {
    pathname: ARTICLES_PATH,
    title: t('articlesTitle'),
    description: t('articlesDescription'),
    updatedAt: newestArticle ?? ARTICLES_INDEX_LAST_MODIFIED,
    section: 'articles',
  };
  return [index, ...pages];
}
