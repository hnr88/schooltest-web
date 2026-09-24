import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { LandingHomeContent } from '@/modules/landing';
import { LandingPageAeo, buildPageMetadata } from '@/modules/seo';
import { getPublicSettings, PublicSiteBanner } from '@/modules/settings';

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations('Landing.meta');
  const settings = await getPublicSettings();
  return buildPageMetadata({
    title: t('homeTitle'),
    description: t('homeDescription'),
    pathname: '/',
    locale,
    siteName: settings.site_name,
  });
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const t = await getTranslations('Landing.meta');
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
            title={t('homeTitle')}
            description={t('homeDescription')}
          />
        }
      />
    </>
  );
}
