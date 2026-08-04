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
import { PublicBreadcrumb } from '@/modules/navigation';
import { BreadcrumbJsonLd, PublicPageJsonLd, buildPageMetadata } from '@/modules/seo';
import { getPublicSettings } from '@/modules/settings';
import { ClassroomSection } from '@/modules/eald/components/ClassroomSection';
import { GenerateSection } from '@/modules/eald/components/GenerateSection';
import { TeachHero } from '@/modules/eald/components/TeachHero';
import { ThreeMoreSection } from '@/modules/eald/components/ThreeMoreSection';

interface TeachPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: TeachPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations('Eald.meta');
  const settings = await getPublicSettings();
  return buildPageMetadata({
    title: t('teachTitle'),
    description: t('teachDescription'),
    pathname: '/eald/teach',
    locale,
    siteName: settings.site_name,
  });
}

export default async function TeachPage({ params }: TeachPageProps) {
  const { locale } = await params;
  const t = await getTranslations('Eald');

  return (
    <div className="min-h-screen bg-background text-foreground">
      <EaldHeader activePage="teach" />
      <BreadcrumbJsonLd pathname="/eald/teach" locale={locale} />
      <PublicPageJsonLd
        pathname="/eald/teach"
        locale={locale}
        title={t('meta.teachTitle')}
        description={t('meta.teachDescription')}
      />
      <PublicBreadcrumb pathname="/eald/teach" />
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
