import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { CmsPageScreen, buildCmsMetadata, getCmsPage } from '@/modules/cms';

interface CatchAllPageProps {
  params: Promise<{ locale: string; rest: string[] }>;
}

async function resolve(rest: readonly string[], locale: string) {
  if (rest.length !== 1) return null;
  const resolved = await getCmsPage(rest[0], locale);
  // Articles live under /articles/<slug>; the root only serves legal/info pages.
  return resolved && resolved.page.pageType !== 'article' ? resolved : null;
}

export async function generateMetadata({ params }: CatchAllPageProps): Promise<Metadata> {
  const { locale, rest } = await params;
  return buildCmsMetadata(await resolve(rest, locale));
}

// Lowest-priority catch-all (next-intl's documented pattern). A single segment
// is looked up as a published CMS legal/info page (/about, /contact, …);
// anything else — or an unreachable CMS — throws into the segment's branded
// not-found boundary, never a crash.
export default async function CatchAllPage({ params }: CatchAllPageProps) {
  const { locale, rest } = await params;
  const resolved = await resolve(rest, locale);
  if (!resolved) notFound();
  return <CmsPageScreen resolved={resolved} />;
}
