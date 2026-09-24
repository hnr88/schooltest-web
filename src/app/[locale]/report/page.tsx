import type { Metadata } from 'next';

import { LandingReportContent } from '@/modules/landing';
import { PublicFooter } from '@/modules/cms';
import { LandingPageAeo, buildPublicPageMetadata } from '@/modules/seo';
import { getPublicSettings, PublicSiteBanner } from '@/modules/settings';

interface ReportPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ReportPageProps): Promise<Metadata> {
  const { locale } = await params;
  const settings = await getPublicSettings();
  return buildPublicPageMetadata({ pathname: '/report', locale, siteName: settings.site_name });
}

export default async function ReportPage({ params }: ReportPageProps) {
  const { locale } = await params;
  // C-SET-01: the ops-authored announcement/maintenance banner rides ABOVE the
  // public masthead on every marketing page (renders null while both are off).
  const settings = await getPublicSettings();

  return (
    <>
      <PublicSiteBanner settings={settings} />
      <LandingReportContent
        footer={<PublicFooter locale={locale} />}
        aeo={
          <LandingPageAeo
            page="report"
            pathname="/report"
            locale={locale}
          />
        }
      />
    </>
  );
}
