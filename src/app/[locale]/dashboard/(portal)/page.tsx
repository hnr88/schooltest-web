import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { DashboardRoleGate, DashboardScreen } from '@/modules/dashboard';
import { TeacherDashboardGate, TeacherDashboardSplitScreen } from '@/modules/teacher';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Dashboard.meta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

// `/dashboard` serves THREE personas, and the split is deliberate.
//
// The parent auth gate lives in the (portal) route group layout, so this page
// only renders content. DashboardRoleGate (task 27) redirects a resolved
// school_admin to /dashboard/school and an ops user to /dashboard/ops — those
// sections are whole apps of their own, so they get their own root.
//
// A teacher is NOT redirected any more (.qa/DECISIONS.md A4: ONE shell, role
// filtered). `/dashboard` IS the teacher's Dashboard — the rail's
// TEACHER_DASHBOARD_HREF points here — so `teacher` was removed from
// ROLE_DESTINATIONS and the branch happens in-place instead. The role is only
// knowable client-side (the JWT lives in localStorage), so TeacherDashboardGate
// is a client gate that mounts exactly one of the two screens; the parent
// Overview is untouched for every non-teacher role.
//
// The teacher screen mounted here is Dash C (Split) — the layout the operator
// locked. It was first mounted only at /dashboard/teach, which nothing in the
// rail links to, so the rail's TEACHER_DASHBOARD_HREF ('/dashboard') still
// rendered the pre-v2 TeacherDashboardScreen and the redesign was unreachable
// by navigation. Both routes now render the same split screen.
export default function DashboardPage() {
  return (
    <DashboardRoleGate>
      <TeacherDashboardGate teacher={<TeacherDashboardSplitScreen />} fallback={<DashboardScreen />} />
    </DashboardRoleGate>
  );
}
