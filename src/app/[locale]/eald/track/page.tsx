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
import { PublicBreadcrumb } from '@/modules/navigation';
import { BreadcrumbJsonLd, PublicPageJsonLd, buildPageMetadata } from '@/modules/seo';
import { getPublicSettings } from '@/modules/settings';
import { EvidenceSection } from '@/modules/eald';
import { TeachEmpiricalSection } from '@/modules/eald';
import { TrackHero } from '@/modules/eald';

interface TrackPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: TrackPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations('Eald.meta');
  const settings = await getPublicSettings();
  return buildPageMetadata({
    title: t('trackTitle'),
    description: t('trackDescription'),
    pathname: '/eald/track',
    locale,
    siteName: settings.site_name,
  });
}

export default async function TrackPage({ params }: TrackPageProps) {
  const { locale } = await params;
  const t = await getTranslations('Eald');

  return (
    <div className="min-h-screen bg-background text-foreground">
      <EaldHeader activePage="track" />
      <BreadcrumbJsonLd pathname="/eald/track" locale={locale} />
      <PublicPageJsonLd
        pathname="/eald/track"
        locale={locale}
        title={t('meta.trackTitle')}
        description={t('meta.trackDescription')}
      />
      <PublicBreadcrumb pathname="/eald/track" />
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
