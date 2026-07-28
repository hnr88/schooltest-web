import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import {
  DiagnoseHero,
  EaldCtaBand,
  EaldFooter,
  EaldHeader,
  NextSectionNav,
  QuoteBand,
  SameScoreSection,
  UnpackSection,
  DIAGNOSE_NEXT_SECTIONS,
} from '@/modules/eald';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Eald.meta');
  return {
    title: t('diagnoseTitle'),
    description: t('diagnoseDescription'),
    openGraph: { title: t('diagnoseTitle'), description: t('diagnoseDescription') },
  };
}

export default async function DiagnosePage() {
  const t = await getTranslations('Eald');

  return (
    <div className="min-h-screen bg-white text-foreground">
      <EaldHeader activePage="diagnose" />
      <main>
        <DiagnoseHero />
        <UnpackSection />
        <SameScoreSection />
        <QuoteBand
          quote={t.rich('diagnose.quote', { br: () => <br /> })}
        />
        <NextSectionNav sections={DIAGNOSE_NEXT_SECTIONS} />
        <EaldCtaBand />
      </main>
      <EaldFooter />
    </div>
  );
}
