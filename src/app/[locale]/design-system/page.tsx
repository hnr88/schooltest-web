import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { NOINDEX_ROBOTS } from '@/modules/seo';

import {
  AlertsSection,
  BadgesSection,
  BrandSection,
  ButtonsSection,
  CardsSection,
  ChoicesSection,
  Container,
  DataSection,
  FeedbackSection,
  FormsSection,
  MediaSection,
  OverlaysSection,
  RecordsSection,
} from '@/modules/design-system';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('DesignSystem');
  return {
    title: t('meta.title'),
    description: t('meta.description'),
    openGraph: {
      title: t('meta.title'),
      description: t('meta.description'),
      url: '/design-system',
    },
    // Not a public product page (.qa/DECISIONS.md D-27): robots.txt disallows
    // it, and this keeps it out of the index under EVERY locale prefix, which a
    // bare robots Disallow line cannot express.
    robots: NOINDEX_ROBOTS,
  };
}

export default async function DesignSystemPage() {
  const t = await getTranslations('DesignSystem');
  return (
    <main>
      <Container>
        <header className="border-b py-12">
          <h1 className="text-4xl font-bold tracking-tight">{t('pageTitle')}</h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{t('pageDescription')}</p>
        </header>
        <BrandSection />
        <ButtonsSection />
        <BadgesSection />
        <AlertsSection />
        <CardsSection />
        <FormsSection />
        <ChoicesSection />
        <OverlaysSection />
        <DataSection />
        <RecordsSection />
        <MediaSection />
        <FeedbackSection />
      </Container>
    </main>
  );
}
