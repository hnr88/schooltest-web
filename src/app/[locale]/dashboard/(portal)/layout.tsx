import type { ReactNode } from 'react';

import { DashboardOnboardingGuard } from '@/app/[locale]/dashboard/(portal)/DashboardOnboardingGuard';
import { ParentGuard } from '@/modules/auth';

// Parent portal guard boundary (task 27, st-mvp-pivot): the blanket ParentGuard
// that used to sit in the dashboard layout now wraps ONLY the parent portal
// tree, moved under this (portal) route group so URLs are unchanged. The
// /dashboard/school and /dashboard/teach sections carry their own role guards
// (SchoolAdminGuard / TeacherGuard) one level down and never pass through here.
export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <ParentGuard>
      <DashboardOnboardingGuard>{children}</DashboardOnboardingGuard>
    </ParentGuard>
  );
}
