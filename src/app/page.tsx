import { LandingHeader, LandingHero } from '@/modules/landing';

export default function Home() {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <LandingHeader />
      <LandingHero />
    </div>
  );
}
