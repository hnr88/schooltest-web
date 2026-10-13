import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { CmsPageScreen, buildCmsMetadata, getCmsPage } from '@/modules/cms';

const SLUG = 'acceptable-use';

interface AcceptableUsePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: AcceptableUsePageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildCmsMetadata(await getCmsPage(SLUG, locale));
}

// Public trust-centre page, rendered from the Strapi CMS page 'acceptable-use'.
export default async function AcceptableUsePage({ params }: AcceptableUsePageProps) {
  const { locale } = await params;
  const resolved = await getCmsPage(SLUG, locale);
  if (!resolved || resolved.page.pageType === 'article') notFound();
  return <CmsPageScreen resolved={resolved} />;
}
