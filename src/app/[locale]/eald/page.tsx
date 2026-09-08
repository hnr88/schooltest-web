import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import {
  EaldCtaBand,
  EaldFooter,
  EaldHeader,
  EaldHero,
} from '@/modules/eald';
import { StatStrip } from '@/modules/design-system';
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

interface EaldHomeProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: EaldHomeProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations('Eald.meta');
  const settings = await getPublicSettings();
  // /eald renders the SAME sections as the site root (only the hero image
  // differs), so it canonicalises to `/` rather than competing with it for the
  // same query. It stays crawlable and linked — it is the EAL/D section root in
  // the breadcrumb trail — but it is not a second indexable original, and it is
  // deliberately absent from PUBLIC_ROUTES so the sitemap lists one URL, not two.
  return buildPageMetadata({
    title: t('homeTitle'),
    description: t('homeDescription'),
    pathname: '/eald',
    canonicalPath: '/',
    locale,
    siteName: settings.site_name,
  });
}

export default async function EaldHome({ params }: EaldHomeProps) {
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
      <BreadcrumbJsonLd pathname="/eald" locale={locale} />
      <PublicPageJsonLd
        pathname="/eald"
        locale={locale}
        title={t('meta.homeTitle')}
        description={t('meta.homeDescription')}
      />
      {/* Home v2:78 puts the crumb row INSIDE the hero band, so the standalone
          row above <main> is gone; the slot below renders the same
          PublicBreadcrumb, which still draws from buildTrail — the registry
          BreadcrumbJsonLd above uses too, so visible trail and JSON-LD stay
          one derivation. */}
      <main id="main-content">
        <EaldHero
          centered={false}
          eyebrow={t('home.hero.eyebrow')}
          title={t('home.hero.title')}
          subtitle={t('home.hero.subtitle')}
          primaryCta={{ label: t('home.hero.primaryCta'), href: '#register' }}
          secondaryCta={{ label: t('home.hero.secondaryCta'), href: '/eald/diagnose' }}
          subText={t('home.hero.microcopy')}
          breadcrumb={<PublicBreadcrumb pathname="/eald" className="py-0" />}
          stats={
            <StatStrip
              ariaLabel={t('home.hero.statsLabel')}
              className="grid grid-cols-2 gap-y-6 lg:grid-cols-4 lg:gap-y-0 [&>div]:py-4 lg:[&>div]:py-5 lg:[&>div]:px-6 lg:[&>div:first-child]:pl-0 lg:[&>div:last-child]:pr-0 lg:[&>div+div]:border-l lg:[&>div+div]:border-white/15 [&>div>dd]:order-2 [&>div>dt]:order-1 [&>div>dd]:text-white [&>div>dt]:tracking-widest [&>div>dt]:text-navy-muted [&>div>dt]:uppercase"
              items={[
                { label: t('home.hero.stat1Label'), value: t('home.hero.stat1Value') },
                { label: t('home.hero.stat2Label'), value: t('home.hero.stat2Value') },
                { label: t('home.hero.stat3Label'), value: t('home.hero.stat3Value') },
                { label: t('home.hero.stat4Label'), value: t('home.hero.stat4Value') },
              ]}
            />
          }
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
