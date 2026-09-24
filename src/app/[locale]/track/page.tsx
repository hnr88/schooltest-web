import type { Metadata } from 'next';

import { LandingTrackContent } from '@/modules/landing';
import { PublicFooter } from '@/modules/cms';
import { LandingPageAeo, buildPublicPageMetadata } from '@/modules/seo';
import { getPublicSettings, PublicSiteBanner } from '@/modules/settings';

interface TrackPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: TrackPageProps): Promise<Metadata> {
  const { locale } = await params;
  const settings = await getPublicSettings();
  return buildPublicPageMetadata({ pathname: '/track', locale, siteName: settings.site_name });
}

export default async function TrackPage({ params }: TrackPageProps) {
  const { locale } = await params;
  // C-SET-01: the ops-authored announcement/maintenance banner rides ABOVE the
  // public masthead on every marketing page (renders null while both are off).
  const settings = await getPublicSettings();

  return (
    <>
      <PublicSiteBanner settings={settings} />
      <LandingTrackContent
        footer={<PublicFooter locale={locale} />}
        aeo={
          <LandingPageAeo
            page="track"
            pathname="/track"
            locale={locale}
          />
        }
      />
    </>
  );
}
