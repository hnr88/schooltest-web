import { ogStaticParams, renderOgCardForPath } from '@/modules/seo/lib/render-og-card';
import type { OgRouteParams } from '@/modules/seo/types/og.types';

export const alt = 'SchoolTest: Report';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const generateStaticParams = ogStaticParams;

export default async function Image({ params }: OgRouteParams) {
  const { locale } = await params;
  return renderOgCardForPath('/report', locale);
}
