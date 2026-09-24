import { notFound } from 'next/navigation';

import { isLocale } from '@/i18n/routing';
import { articlesFeedResponse } from '@/modules/cms';

interface FeedRouteContext {
  params: Promise<{ locale: string }>;
}

// /<locale>/articles/feed.xml — dotted paths bypass the i18n proxy, so the
// locale comes straight from the URL (the default locale has its own route).
export async function GET(_request: Request, { params }: FeedRouteContext): Promise<Response> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return articlesFeedResponse(locale);
}
