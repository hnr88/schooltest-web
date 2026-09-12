import type { ReactNode } from 'react';

import { TeacherGuard } from '@/modules/auth';

// The /dashboard/teach section is teacher-only (spec §15: separate teacher
// dashboard) EXCEPT /dashboard/teach/notifications and /dashboard/teach/settings,
// which D-16a (task 113) and notifications/06 (D-08) open to school staff - so
// the guard lives in this (teacher) route group (URLs unchanged, same split as
// the dashboard's (portal) group) and those routes carry their own
// SchoolStaffGuard layouts.
//
// Teacher Portal v2 (R1 PART B): every page still inside this group is a
// redirect onto the v2 class detail, so the guard now only covers the hand-over
// — the destination re-asserts the role itself.
export default function TeachLayout({ children }: { children: ReactNode }) {
  return <TeacherGuard>{children}</TeacherGuard>;
}
