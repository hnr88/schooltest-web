import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { AdminAnalyticsScreen } from '@/modules/school-admin';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('SchoolAdmin.analytics.meta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

// School administrator analytics (task 78, mvp spec 4.3): the three-level
// school -> class -> student view plus the C-RPT-05 results export. The
// SchoolAdminGuard in the section layout keeps this school_admin-only.
export default function SchoolAnalyticsPage() {
  return <AdminAnalyticsScreen />;
}
