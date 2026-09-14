import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { LandingTeachContent } from '@/modules/landing';
import { BreadcrumbJsonLd, PublicPageJsonLd, buildPageMetadata } from '@/modules/seo';
import { getPublicSettings, PublicSiteBanner } from '@/modules/settings';

interface TeachPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: TeachPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations('Landing.meta');
  const settings = await getPublicSettings();
  return buildPageMetadata({
    title: t('teachTitle'),
    description: t('teachDescription'),
    pathname: '/teach',
    locale,
    siteName: settings.site_name,
  });
}

export default async function TeachPage({ params }: TeachPageProps) {
  const { locale } = await params;
  const t = await getTranslations('Landing.meta');
  // C-SET-01: the ops-authored announcement/maintenance banner rides ABOVE the
  // public masthead on every marketing page (renders null while both are off).
  const settings = await getPublicSettings();

  return (
    <>
      <PublicSiteBanner settings={settings} />
      <BreadcrumbJsonLd pathname="/teach" locale={locale} />
      <PublicPageJsonLd
        pathname="/teach"
        locale={locale}
        title={t('teachTitle')}
        description={t('teachDescription')}
      />
      <LandingTeachContent />
    </>
  );
}
