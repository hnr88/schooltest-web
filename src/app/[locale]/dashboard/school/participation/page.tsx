import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { ParticipationScreen } from '@/modules/school-admin';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('SchoolAdmin.participation.meta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

// School participation monitor (task 78, mvp spec 4.3): the admin's main
// operational screen. The SchoolAdminGuard in the section layout keeps this
// school_admin-only; the C-RPT-04 route re-asserts the role + school scope.
export default function SchoolParticipationPage() {
  return <ParticipationScreen />;
}
