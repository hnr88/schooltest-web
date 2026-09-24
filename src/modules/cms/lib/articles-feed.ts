import { getTranslations } from 'next-intl/server';

import { routing } from '@/i18n/routing';
import { ARTICLES_FEED_PATH, ARTICLES_PATH } from '@/modules/cms/constants/cms.constants';
import { cmsPagePath } from '@/modules/cms/lib/cms-paths';
import { listAllCmsPages } from '@/modules/cms/lib/cms-queries';
import { buildRssFeed } from '@/modules/cms/lib/feed';
import { absoluteUrl } from '@/modules/seo';

/**
 * RSS 2.0 of the published, indexable CMS articles for one locale. An
 * unreachable CMS yields a valid, empty feed rather than an error.
 */
export async function articlesFeedResponse(locale: string): Promise<Response> {
  const t = await getTranslations({ locale, namespace: 'Cms' });
  const articles = (await listAllCmsPages(locale, 'article')).filter((article) => !article.seo?.noindex);
  const url = (path: string) => absoluteUrl(path, locale, routing.defaultLocale);

  const xml = buildRssFeed({
    title: t('articlesTitle'),
    description: t('articlesDescription'),
    language: locale,
    homePageUrl: url(ARTICLES_PATH),
    feedUrl: url(ARTICLES_FEED_PATH),
    items: articles.map((article) => ({
      id: url(cmsPagePath(article)),
      url: url(cmsPagePath(article)),
      title: article.title,
      summary: article.seo?.metaDescription || article.summary || article.title,
      publishedAt: article.publishedDate ?? article.publishedAt ?? article.updatedAt,
      ...(article.author ? { authorName: article.author.name } : {}),
    })),
  });

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
    },
  });
}
