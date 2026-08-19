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
  PilotPositioningSection,
  PricingSection,
  TrustedByStrip,
  WhySchoolsSection,
} from '@/modules/landing';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Home.meta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
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
        <PilotPositioningSection />
        <TrustedByStrip />
        <FeaturesSection />
        <WhySchoolsSection />
        <FeatureDetailSection />
        {/* StatsBand is NOT mounted: all three of its numbers were fabricated -
            "2.4M tests delivered" (the live database holds 161 results), "98% grading
            accuracy" (no accuracy study exists) and "6 hrs saved per teacher, weekly"
            (invented). Same rule as TrustedByStrip: no statistic goes on this page until
            someone can name its source. Re-mount it when the numbers are real. */}
        <HowItWorksSection />
        <PricingSection />
        <FaqSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
