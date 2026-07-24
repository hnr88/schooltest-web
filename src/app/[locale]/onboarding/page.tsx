import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { OnboardingScreen } from '@/modules/onboarding';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Onboarding.meta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

// Onboarding wizard route for authenticated parents (task 025,
// contracts C-ONBOARD-GET, C-ONBOARD-UPDATE). Auth gating lives in the
// onboarding layout so this page can stay a server component.
export default function OnboardingPage() {
  return <OnboardingScreen />;
}
