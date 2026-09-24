import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { CmsPageScreen, buildCmsMetadata, getCmsPage } from '@/modules/cms';

interface ArticlePageProps {
  params: Promise<{ locale: string; slug: string }>;
}

async function resolve(slug: string, locale: string) {
  const resolved = await getCmsPage(slug, locale);
  return resolved && resolved.page.pageType === 'article' ? resolved : null;
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  return buildCmsMetadata(await resolve(slug, locale));
}

// One article: a published CMS page of type `article`.
export default async function ArticlePage({ params }: ArticlePageProps) {
  const { locale, slug } = await params;
  const resolved = await resolve(slug, locale);
  if (!resolved) notFound();
  return <CmsPageScreen resolved={resolved} />;
}
