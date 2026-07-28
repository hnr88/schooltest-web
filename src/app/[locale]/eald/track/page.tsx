import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import {
  EaldCtaBand,
  EaldFooter,
  EaldHeader,
  NextSectionNav,
  QuoteBand,
  TRACK_NEXT_SECTIONS,
} from '@/modules/eald';
import { EvidenceSection } from '@/modules/eald/components/EvidenceSection';
import { TeachEmpiricalSection } from '@/modules/eald/components/TeachEmpiricalSection';
import { TrackHero } from '@/modules/eald/components/TrackHero';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Eald.meta');
  return {
    title: t('trackTitle'),
    description: t('trackDescription'),
    openGraph: { title: t('trackTitle'), description: t('trackDescription') },
  };
}

export default async function TrackPage() {
  const t = await getTranslations('Eald');

  return (
    <div className="min-h-screen bg-background text-foreground">
      <EaldHeader activePage="track" />
      <main>
        <TrackHero />
        <EvidenceSection />
        <TeachEmpiricalSection />
        <QuoteBand
          quote={t.rich('track.quote', {
            br: () => <br />,
          })}
        />
        <NextSectionNav sections={TRACK_NEXT_SECTIONS} />
        <EaldCtaBand />
      </main>
      <EaldFooter />
    </div>
  );
}
