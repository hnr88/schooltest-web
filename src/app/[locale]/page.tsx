import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import {
  EaldCtaBand,
  EaldFooter,
  EaldHeader,
  EaldHero,
} from '@/modules/eald';
import { PublicBreadcrumb } from '@/modules/navigation';
import { BreadcrumbJsonLd, PublicPageJsonLd, buildPageMetadata } from '@/modules/seo';
import { getPublicSettings } from '@/modules/settings';
import { ClassroomBand } from '@/modules/eald';
import { EaldTrustedBy } from '@/modules/eald';
import { ProblemSection } from '@/modules/eald';
import { ProofSection } from '@/modules/eald';
import { RegisterSection } from '@/modules/eald';
import { SolutionBand } from '@/modules/eald';
import { WhatYouGetSection } from '@/modules/eald';

interface HomeProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: HomeProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations('Eald.meta');
  const settings = await getPublicSettings();
  return buildPageMetadata({
    title: t('homeTitle'),
    description: t('homeDescription'),
    pathname: '/',
    locale,
    siteName: settings.site_name,
  });
}

export default async function Home({ params }: HomeProps) {
  const { locale } = await params;
  const t = await getTranslations('Eald');

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-6 focus:z-50 focus:rounded-lg focus:bg-background focus:px-4 focus:py-2.5 focus:text-sm focus:font-medium focus:text-foreground focus:outline-2 focus:outline-offset-2 focus:outline-ring"
      >
        {t('nav.label')}
      </a>
      <EaldHeader activePage="home" />
      <BreadcrumbJsonLd pathname="/" locale={locale} />
      <PublicPageJsonLd
        pathname="/"
        locale={locale}
        title={t('meta.homeTitle')}
        description={t('meta.homeDescription')}
        isSiteRoot
      />
      <PublicBreadcrumb pathname="/" />
      <main id="main-content">
        <EaldHero
          badge={t('home.hero.badge')}
          title={t('home.hero.title')}
          subtitle={t('home.hero.subtitle')}
          primaryCta={{ label: t('home.hero.primaryCta'), href: '#register' }}
          secondaryCta={{ label: t('home.hero.secondaryCta'), href: '/eald/diagnose' }}
          subText={t('home.hero.microcopy')}
          imageSrc="/images/kaleb-tapp-1deQbU6DhBg-unsplash.jpg"
        />
        <EaldTrustedBy />
        <ProblemSection />
        <SolutionBand />
        <WhatYouGetSection />
        <ClassroomBand />
        <ProofSection />
        <RegisterSection />
        <EaldCtaBand />
      </main>
      <EaldFooter />
    </div>
  );
}
