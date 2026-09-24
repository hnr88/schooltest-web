import type { Metadata } from 'next';

import { LandingPredictContent } from '@/modules/landing';
import { LandingPageAeo, buildPublicPageMetadata } from '@/modules/seo';
import { getPublicSettings, PublicSiteBanner } from '@/modules/settings';

interface PredictPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PredictPageProps): Promise<Metadata> {
  const { locale } = await params;
  const settings = await getPublicSettings();
  return buildPublicPageMetadata({ pathname: '/predict', locale, siteName: settings.site_name });
}

export default async function PredictPage({ params }: PredictPageProps) {
  const { locale } = await params;
  // C-SET-01: the ops-authored announcement/maintenance banner rides ABOVE the
  // public masthead on every marketing page (renders null while both are off).
  const settings = await getPublicSettings();

  return (
    <>
      <PublicSiteBanner settings={settings} />
      <LandingPredictContent
        aeo={
          <LandingPageAeo
            page="predict"
            pathname="/predict"
            locale={locale}
          />
        }
      />
    </>
  );
}
