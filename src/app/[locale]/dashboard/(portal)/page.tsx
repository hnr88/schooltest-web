import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { DashboardRoleGate, DashboardScreen } from '@/modules/dashboard';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Dashboard.meta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

// The parent auth gate lives in the (portal) route group layout — this page
// renders the parent Overview only. DashboardRoleGate (task 27) redirects a
// resolved school_admin to /dashboard/school and a teacher to /dashboard/teach
// before the parent portal paints.
export default function DashboardPage() {
  return (
    <DashboardRoleGate>
      <DashboardScreen />
    </DashboardRoleGate>
  );
}
