import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { LandingReportContent } from '@/modules/landing';
import { BreadcrumbJsonLd, PublicPageJsonLd, buildPageMetadata } from '@/modules/seo';
import { getPublicSettings } from '@/modules/settings';

interface ReportPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ReportPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations('Landing.meta');
  const settings = await getPublicSettings();
  return buildPageMetadata({
    title: t('reportTitle'),
    description: t('reportDescription'),
    pathname: '/report',
    locale,
    siteName: settings.site_name,
  });
}

export default async function ReportPage({ params }: ReportPageProps) {
  const { locale } = await params;
  const t = await getTranslations('Landing.meta');

  return (
    <>
      <BreadcrumbJsonLd pathname="/report" locale={locale} />
      <PublicPageJsonLd
        pathname="/report"
        locale={locale}
        title={t('reportTitle')}
        description={t('reportDescription')}
      />
      <LandingReportContent />
    </>
  );
}
