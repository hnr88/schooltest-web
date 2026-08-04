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
import { BreadcrumbJsonLd, PublicPageJsonLd, buildPageMetadata } from '@/modules/seo';
import { getPublicSettings } from '@/modules/settings';

interface DiagnosePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: DiagnosePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations('Eald.meta');
  const settings = await getPublicSettings();
  return buildPageMetadata({
    title: t('diagnoseTitle'),
    description: t('diagnoseDescription'),
    pathname: '/eald/diagnose',
    locale,
    siteName: settings.site_name,
  });
}

export default async function DiagnosePage({ params }: DiagnosePageProps) {
  const { locale } = await params;
  const t = await getTranslations('Eald');

  return (
    <div className="min-h-screen bg-white text-foreground">
      <EaldHeader activePage="diagnose" />
      <BreadcrumbJsonLd pathname="/eald/diagnose" locale={locale} />
      <PublicPageJsonLd
        pathname="/eald/diagnose"
        locale={locale}
        title={t('meta.diagnoseTitle')}
        description={t('meta.diagnoseDescription')}
      />
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
