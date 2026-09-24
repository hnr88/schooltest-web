import type { Metadata } from 'next';

import { LandingDiagnoseContent } from '@/modules/landing';
import { PublicFooter } from '@/modules/cms';
import { LandingPageAeo, buildPublicPageMetadata } from '@/modules/seo';
import { getPublicSettings, PublicSiteBanner } from '@/modules/settings';

interface DiagnosePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: DiagnosePageProps): Promise<Metadata> {
  const { locale } = await params;
  const settings = await getPublicSettings();
  return buildPublicPageMetadata({ pathname: '/diagnose', locale, siteName: settings.site_name });
}

export default async function DiagnosePage({ params }: DiagnosePageProps) {
  const { locale } = await params;
  // C-SET-01: the ops-authored announcement/maintenance banner rides ABOVE the
  // public masthead on every marketing page (renders null while both are off).
  const settings = await getPublicSettings();

  return (
    <>
      <PublicSiteBanner settings={settings} />
      <LandingDiagnoseContent
        footer={<PublicFooter locale={locale} />}
        aeo={
          <LandingPageAeo
            page="diagnose"
            pathname="/diagnose"
            locale={locale}
          />
        }
      />
    </>
  );
}
