import type { Metadata } from 'next';

import { LandingHomeContent } from '@/modules/landing';
import { LandingPageAeo, buildPublicPageMetadata } from '@/modules/seo';
import { getPublicSettings, PublicSiteBanner } from '@/modules/settings';

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  const settings = await getPublicSettings();
  return buildPublicPageMetadata({ pathname: '/', locale, siteName: settings.site_name });
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  // C-SET-01: the ops-authored announcement/maintenance banner rides ABOVE the
  // public masthead on every marketing page (renders null while both are off).
  const settings = await getPublicSettings();

  return (
    <>
      <PublicSiteBanner settings={settings} />
      <LandingHomeContent
        aeo={
          <LandingPageAeo
            page="home"
            pathname="/"
            locale={locale}
          />
        }
      />
    </>
  );
}
