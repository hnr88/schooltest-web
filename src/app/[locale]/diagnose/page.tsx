import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { LandingDiagnoseContent } from '@/modules/landing';
import { BreadcrumbJsonLd, PublicPageJsonLd, buildPageMetadata } from '@/modules/seo';
import { getPublicSettings } from '@/modules/settings';

interface DiagnosePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: DiagnosePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations('Landing.meta');
  const settings = await getPublicSettings();
  return buildPageMetadata({
    title: t('diagnoseTitle'),
    description: t('diagnoseDescription'),
    pathname: '/diagnose',
    locale,
    siteName: settings.site_name,
  });
}

export default async function DiagnosePage({ params }: DiagnosePageProps) {
  const { locale } = await params;
  const t = await getTranslations('Landing.meta');

  return (
    <>
      <BreadcrumbJsonLd pathname="/diagnose" locale={locale} />
      <PublicPageJsonLd
        pathname="/diagnose"
        locale={locale}
        title={t('diagnoseTitle')}
        description={t('diagnoseDescription')}
      />
      <LandingDiagnoseContent />
    </>
  );
}
