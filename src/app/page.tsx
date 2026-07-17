import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import {
  AnnouncementBar,
  CtaSection,
  FaqSection,
  FeatureDetailSection,
  FeaturesSection,
  HeroSection,
  HowItWorksSection,
  LandingFooter,
  LandingHeader,
  PricingSection,
  StatsBand,
  TrustedByStrip,
} from '@/modules/landing';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Home.meta');
  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function Home() {
  const t = await getTranslations('Home');
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Skip link must be the first focusable element on the page (WCAG 2.4.1). */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-6 focus:z-50 focus:rounded-lg focus:bg-background focus:px-4 focus:py-2.5 focus:text-sm focus:font-medium focus:text-foreground focus:outline-2 focus:outline-offset-2 focus:outline-ring"
      >
        {t('skipToContent')}
      </a>
      <AnnouncementBar />
      <LandingHeader />
      <main id="main-content">
        <HeroSection />
        <TrustedByStrip />
        <FeaturesSection />
        <FeatureDetailSection />
        <StatsBand />
        <HowItWorksSection />
        <PricingSection />
        <FaqSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
