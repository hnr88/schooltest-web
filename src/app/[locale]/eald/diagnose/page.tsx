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
import { PublicBreadcrumb } from '@/modules/navigation';
import { BreadcrumbJsonLd } from '@/modules/seo';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Eald.meta');
  return {
    title: t('diagnoseTitle'),
    description: t('diagnoseDescription'),
    openGraph: { title: t('diagnoseTitle'), description: t('diagnoseDescription') },
  };
}

interface DiagnosePageProps {
  params: Promise<{ locale: string }>;
}

export default async function DiagnosePage({ params }: DiagnosePageProps) {
  const { locale } = await params;
  const t = await getTranslations('Eald');

  return (
    <div className="min-h-screen bg-white text-foreground">
      <EaldHeader activePage="diagnose" />
      <BreadcrumbJsonLd pathname="/eald/diagnose" locale={locale} />
      <PublicBreadcrumb pathname="/eald/diagnose" />
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
