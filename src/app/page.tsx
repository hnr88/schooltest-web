import {
  AnnouncementBar,
  FeatureDetailSection,
  FeaturesSection,
  HeroSection,
  LandingHeader,
  StatsBand,
  TrustedByStrip,
} from '@/modules/landing';

export default function Home() {
  return (
    <>
      <AnnouncementBar />
      <LandingHeader />
      <HeroSection />
      <TrustedByStrip />
      <FeaturesSection />
      <FeatureDetailSection />
      <StatsBand />
    </>
  );
}
