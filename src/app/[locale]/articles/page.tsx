import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { ARTICLES_FEED_PATH, ARTICLES_PAGE_SIZE, ARTICLES_PATH, ArticlesIndexScreen, listCmsPages } from '@/modules/cms';
import { buildMetadata } from '@/modules/seo';

interface ArticlesPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}

function pageNumber(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? '1', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export async function generateMetadata({ params, searchParams }: ArticlesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const page = pageNumber((await searchParams).page);
  const t = await getTranslations({ locale, namespace: 'Cms' });
  const metadata = buildMetadata({
    title: t('articlesTitle'),
    description: t('articlesDescription'),
    pathname: ARTICLES_PATH,
    locale,
    noindex: page > 1,
  });
  return {
    ...metadata,
    alternates: { ...metadata.alternates, types: { 'application/rss+xml': ARTICLES_FEED_PATH } },
  };
}

// The article index: published CMS pages of type `article` (newest first).
export default async function ArticlesPage({ params, searchParams }: ArticlesPageProps) {
  const { locale } = await params;
  const page = pageNumber((await searchParams).page);
  const list = await listCmsPages({ locale, type: 'article', page, pageSize: ARTICLES_PAGE_SIZE });
  return <ArticlesIndexScreen locale={locale} list={list} />;
}
