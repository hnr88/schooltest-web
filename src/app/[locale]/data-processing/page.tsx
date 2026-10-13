import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { CmsPageScreen, buildCmsMetadata, getCmsPage } from '@/modules/cms';

const SLUG = 'data-processing';

interface DataProcessingPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: DataProcessingPageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildCmsMetadata(await getCmsPage(SLUG, locale));
}

// Public trust-centre page, rendered from the Strapi CMS page 'data-processing'.
export default async function DataProcessingPage({ params }: DataProcessingPageProps) {
  const { locale } = await params;
  const resolved = await getCmsPage(SLUG, locale);
  if (!resolved || resolved.page.pageType === 'article') notFound();
  return <CmsPageScreen resolved={resolved} />;
}
