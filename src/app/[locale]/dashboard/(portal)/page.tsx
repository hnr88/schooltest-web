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

// `/dashboard` redirects every sectioned persona to its own root and renders
// the parent Overview for what remains.
//
// The parent auth gate lives in the (portal) route group layout, so this page
// only renders content. DashboardRoleGate (task 27) redirects a resolved
// school_admin to /dashboard/school, an ops user to /dashboard/ops and —
// since task 10 retired the two superseded teacher dashboards (R-01/R-16) —
// a TEACHER to /dashboard/results, whose class list is the teacher's home
// surface. The old in-place branch (A4: one shell, role filtered) is reversed
// here: ROLE_DESTINATIONS now carries the teacher row like every other
// sectioned role. The parent Overview remains the fallback for every role
// without its own root.
export default function DashboardPage() {
  return (
    <DashboardRoleGate>
      <DashboardScreen />
    </DashboardRoleGate>
  );
}
