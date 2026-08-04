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
import { PublicBreadcrumb } from '@/modules/navigation';
import { BreadcrumbJsonLd, PublicPageJsonLd, buildPageMetadata } from '@/modules/seo';
import { getPublicSettings } from '@/modules/settings';

interface PredictPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PredictPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations('Eald.meta');
  const settings = await getPublicSettings();
  return buildPageMetadata({
    title: t('predictTitle'),
    description: t('predictDescription'),
    pathname: '/eald/predict',
    locale,
    siteName: settings.site_name,
  });
}

export default async function PredictPage({ params }: PredictPageProps) {
  const { locale } = await params;
  const t = await getTranslations('Eald');

  return (
    <div className="min-h-screen bg-background text-foreground">
      <EaldHeader activePage="predict" />
      <BreadcrumbJsonLd pathname="/eald/predict" locale={locale} />
      <PublicPageJsonLd
        pathname="/eald/predict"
        locale={locale}
        title={t('meta.predictTitle')}
        description={t('meta.predictDescription')}
      />
      <PublicBreadcrumb pathname="/eald/predict" />
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
