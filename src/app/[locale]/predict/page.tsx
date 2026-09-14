import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { LandingPredictContent } from '@/modules/landing';
import { BreadcrumbJsonLd, PublicPageJsonLd, buildPageMetadata } from '@/modules/seo';
import { getPublicSettings } from '@/modules/settings';

interface PredictPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PredictPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations('Landing.meta');
  const settings = await getPublicSettings();
  return buildPageMetadata({
    title: t('predictTitle'),
    description: t('predictDescription'),
    pathname: '/predict',
    locale,
    siteName: settings.site_name,
  });
}

export default async function PredictPage({ params }: PredictPageProps) {
  const { locale } = await params;
  const t = await getTranslations('Landing.meta');

  return (
    <>
      <BreadcrumbJsonLd pathname="/predict" locale={locale} />
      <PublicPageJsonLd
        pathname="/predict"
        locale={locale}
        title={t('predictTitle')}
        description={t('predictDescription')}
      />
      <LandingPredictContent />
    </>
  );
}
