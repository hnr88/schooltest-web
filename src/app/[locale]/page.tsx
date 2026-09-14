import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { LandingHomeContent } from '@/modules/landing';
import { BreadcrumbJsonLd, PublicPageJsonLd, buildPageMetadata } from '@/modules/seo';
import { getPublicSettings } from '@/modules/settings';

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

  return (
    <>
      <BreadcrumbJsonLd pathname="/" locale={locale} />
      <PublicPageJsonLd
        pathname="/"
        locale={locale}
        isSiteRoot
        title={t('homeTitle')}
        description={t('homeDescription')}
      />
      <LandingHomeContent />
    </>
  );
}
