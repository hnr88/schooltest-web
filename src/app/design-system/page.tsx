import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import {
  AlertsSection,
  BadgesSection,
  BrandSection,
  ButtonsSection,
  CardsSection,
  Container,
  DataSection,
  FeedbackSection,
  FormsSection,
  OverlaysSection,
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
        <OverlaysSection />
        <DataSection />
        <FeedbackSection />
      </Container>
    </main>
  );
}
