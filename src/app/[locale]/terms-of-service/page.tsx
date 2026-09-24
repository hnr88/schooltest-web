import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { CmsPageScreen, buildCmsMetadata, getCmsPage } from '@/modules/cms';

const SLUG = 'terms-of-service';

interface TermsOfServicePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: TermsOfServicePageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildCmsMetadata(await getCmsPage(SLUG, locale));
}

// Public legal page, rendered from the Strapi CMS page 'terms-of-service'.
export default async function TermsOfServicePage({ params }: TermsOfServicePageProps) {
  const { locale } = await params;
  const resolved = await getCmsPage(SLUG, locale);
  if (!resolved || resolved.page.pageType === 'article') notFound();
  return <CmsPageScreen resolved={resolved} />;
}
