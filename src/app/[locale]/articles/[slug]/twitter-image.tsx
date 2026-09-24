import { renderOgCardForArticle } from '@/modules/seo/lib/render-og-card';
import type { OgArticleRouteParams } from '@/modules/seo/types/og.types';

export const alt = 'SchoolTest: Article';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: OgArticleRouteParams) {
  const { locale, slug } = await params;
  return renderOgCardForArticle(slug, locale);
}
