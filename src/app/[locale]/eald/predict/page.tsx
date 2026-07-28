import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import {
  CohortSection,
  EaldCtaBand,
  EaldFooter,
  EaldHeader,
  IndividualSection,
  NextSectionNav,
  PredictHero,
  QuoteBand,
  PREDICT_NEXT_SECTIONS,
} from '@/modules/eald';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Eald.meta');
  return {
    title: t('predictTitle'),
    description: t('predictDescription'),
    openGraph: { title: t('predictTitle'), description: t('predictDescription') },
  };
}

export default async function PredictPage() {
  const t = await getTranslations('Eald');

  return (
    <div className="min-h-screen bg-background text-foreground">
      <EaldHeader activePage="predict" />
      <main>
        <PredictHero />
        <IndividualSection />
        <CohortSection />
        <QuoteBand
          quote={t.rich('predict.quote', {
            br: () => <br />,
          })}
        />
        <NextSectionNav sections={PREDICT_NEXT_SECTIONS} />
        <EaldCtaBand />
      </main>
      <EaldFooter />
    </div>
  );
}
