import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { SchoolOnboardingScreen } from '@/modules/school-onboarding';
import { NOINDEX_ROBOTS } from '@/modules/seo';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('SchoolOnboarding.meta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
    robots: NOINDEX_ROBOTS,
  };
}

interface SchoolOnboardingPageProps {
  params: Promise<{ token: string }>;
}

// Guest school onboarding wizard (task 18, contracts C-ONB-01/02/03). The
// token comes from the ops-issued link; no account is required to begin.
export default async function SchoolOnboardingPage({ params }: SchoolOnboardingPageProps) {
  const { token } = await params;
  return <SchoolOnboardingScreen token={token} />;
}
