import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { CmsPageScreen, buildCmsMetadata, getCmsPage } from '@/modules/cms';

const SLUG = 'how-we-use-ai';

interface HowWeUseAiPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: HowWeUseAiPageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildCmsMetadata(await getCmsPage(SLUG, locale));
}

// Public trust-centre page, rendered from the Strapi CMS page 'how-we-use-ai'.
export default async function HowWeUseAiPage({ params }: HowWeUseAiPageProps) {
  const { locale } = await params;
  const resolved = await getCmsPage(SLUG, locale);
  if (!resolved || resolved.page.pageType === 'article') notFound();
  return <CmsPageScreen resolved={resolved} />;
}
