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

export default function Home() {
  return (
    <div className="bg-background text-foreground min-h-screen">
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
