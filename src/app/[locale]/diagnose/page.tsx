import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { LandingDiagnoseContent } from '@/modules/landing';
import { LandingPageAeo, buildPageMetadata } from '@/modules/seo';
import { getPublicSettings, PublicSiteBanner } from '@/modules/settings';

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
  // C-SET-01: the ops-authored announcement/maintenance banner rides ABOVE the
  // public masthead on every marketing page (renders null while both are off).
  const settings = await getPublicSettings();

  return (
    <>
      <PublicSiteBanner settings={settings} />
      <LandingDiagnoseContent
        aeo={
          <LandingPageAeo
            page="diagnose"
            pathname="/diagnose"
            locale={locale}
            title={t('diagnoseTitle')}
            description={t('diagnoseDescription')}
          />
        }
      />
    </>
  );
}
