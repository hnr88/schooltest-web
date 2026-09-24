import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { LandingReportContent } from '@/modules/landing';
import { LandingPageAeo, buildPageMetadata } from '@/modules/seo';
import { getPublicSettings, PublicSiteBanner } from '@/modules/settings';

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
  // C-SET-01: the ops-authored announcement/maintenance banner rides ABOVE the
  // public masthead on every marketing page (renders null while both are off).
  const settings = await getPublicSettings();

  return (
    <>
      <PublicSiteBanner settings={settings} />
      <LandingReportContent
        aeo={
          <LandingPageAeo
            page="report"
            pathname="/report"
            locale={locale}
            title={t('reportTitle')}
            description={t('reportDescription')}
          />
        }
      />
    </>
  );
}
