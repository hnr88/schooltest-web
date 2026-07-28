import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import {
  EaldCtaBand,
  EaldFooter,
  EaldHeader,
  NextSectionNav,
  QuoteBand,
  TEACH_NEXT_SECTIONS,
} from '@/modules/eald';
import { ClassroomSection } from '@/modules/eald/components/ClassroomSection';
import { GenerateSection } from '@/modules/eald/components/GenerateSection';
import { TeachHero } from '@/modules/eald/components/TeachHero';
import { ThreeMoreSection } from '@/modules/eald/components/ThreeMoreSection';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Eald.meta');
  return {
    title: t('teachTitle'),
    description: t('teachDescription'),
    openGraph: { title: t('teachTitle'), description: t('teachDescription') },
  };
}

export default async function TeachPage() {
  const t = await getTranslations('Eald');

  return (
    <div className="min-h-screen bg-background text-foreground">
      <EaldHeader activePage="teach" />
      <main>
        <TeachHero />
        <GenerateSection />
        <ClassroomSection />
        <ThreeMoreSection />
        <QuoteBand
          quote={t.rich('teach.quote', {
            br: () => <br />,
          })}
        />
        <NextSectionNav sections={TEACH_NEXT_SECTIONS} />
        <EaldCtaBand />
      </main>
      <EaldFooter />
    </div>
  );
}
