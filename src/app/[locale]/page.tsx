import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import {
  EaldCtaBand,
  EaldFooter,
  EaldHeader,
  EaldHero,
} from '@/modules/eald';
import { ClassroomBand } from '@/modules/eald/components/ClassroomBand';
import { EaldTrustedBy } from '@/modules/eald/components/EaldTrustedBy';
import { ProblemSection } from '@/modules/eald/components/ProblemSection';
import { ProofSection } from '@/modules/eald/components/ProofSection';
import { RegisterSection } from '@/modules/eald/components/RegisterSection';
import { SolutionBand } from '@/modules/eald/components/SolutionBand';
import { WhatYouGetSection } from '@/modules/eald/components/WhatYouGetSection';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Eald.meta');
  return {
    title: t('homeTitle'),
    description: t('homeDescription'),
    openGraph: { title: t('homeTitle'), description: t('homeDescription') },
  };
}

export default async function Home() {
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
      <main id="main-content">
        <EaldHero
          badge={t('home.hero.badge')}
          title={t('home.hero.title')}
          subtitle={t('home.hero.subtitle')}
          primaryCta={{ label: t('home.hero.primaryCta'), href: '#register' }}
          secondaryCta={{ label: t('home.hero.secondaryCta'), href: '/eald/diagnose' }}
          subText={t('home.hero.microcopy')}
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
