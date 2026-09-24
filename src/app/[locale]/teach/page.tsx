import type { Metadata } from 'next';

import { LandingTeachContent } from '@/modules/landing';
import { LandingPageAeo, buildPublicPageMetadata } from '@/modules/seo';
import { getPublicSettings, PublicSiteBanner } from '@/modules/settings';

interface TeachPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: TeachPageProps): Promise<Metadata> {
  const { locale } = await params;
  const settings = await getPublicSettings();
  return buildPublicPageMetadata({ pathname: '/teach', locale, siteName: settings.site_name });
}

export default async function TeachPage({ params }: TeachPageProps) {
  const { locale } = await params;
  // C-SET-01: the ops-authored announcement/maintenance banner rides ABOVE the
  // public masthead on every marketing page (renders null while both are off).
  const settings = await getPublicSettings();

  return (
    <>
      <PublicSiteBanner settings={settings} />
      <LandingTeachContent
        aeo={
          <LandingPageAeo
            page="teach"
            pathname="/teach"
            locale={locale}
          />
        }
      />
    </>
  );
}
