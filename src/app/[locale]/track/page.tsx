import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { LandingTrackContent } from '@/modules/landing';
import { BreadcrumbJsonLd, PublicPageJsonLd, buildPageMetadata } from '@/modules/seo';
import { getPublicSettings, PublicSiteBanner } from '@/modules/settings';

interface TrackPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: TrackPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations('Landing.meta');
  const settings = await getPublicSettings();
  return buildPageMetadata({
    title: t('trackTitle'),
    description: t('trackDescription'),
    pathname: '/track',
    locale,
    siteName: settings.site_name,
  });
}

export default async function TrackPage({ params }: TrackPageProps) {
  const { locale } = await params;
  const t = await getTranslations('Landing.meta');
  // C-SET-01: the ops-authored announcement/maintenance banner rides ABOVE the
  // public masthead on every marketing page (renders null while both are off).
  const settings = await getPublicSettings();

  return (
    <>
      <PublicSiteBanner settings={settings} />
      <BreadcrumbJsonLd pathname="/track" locale={locale} />
      <PublicPageJsonLd
        pathname="/track"
        locale={locale}
        title={t('trackTitle')}
        description={t('trackDescription')}
      />
      <LandingTrackContent />
    </>
  );
}
