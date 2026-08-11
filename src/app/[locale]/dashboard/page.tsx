import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { DashboardScreen } from '@/modules/dashboard';
import { TeacherDashboardGate, TeacherDashboardScreen } from '@/modules/teacher';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Dashboard.meta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

// The parent auth gate lives in the dashboard layout (task 012) — this page
// renders the Overview content only; the layout guards every /dashboard/* once.
//
// A4 (.qa/DECISIONS.md): `/dashboard` is the TEACHER's Dashboard as well — the
// rail's `TEACHER_DASHBOARD_HREF` points here — so the route serves two
// personas. The role is only knowable client-side (the JWT lives in
// localStorage), so the branch is a client gate that mounts exactly one of the
// two screens; the parent Overview is untouched for every non-teacher role.
export default function DashboardPage() {
  return (
    <TeacherDashboardGate teacher={<TeacherDashboardScreen />} fallback={<DashboardScreen />} />
  );
}
