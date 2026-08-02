import type { ReactNode } from 'react';

import { TeacherGuard } from '@/modules/auth';

// The /dashboard/teach section is teacher-only (spec §15: separate teacher
// dashboard) EXCEPT /dashboard/teach/notifications, which D-16a (task 113)
// opens to school staff - so the guard lives in this (teacher) route group
// (URLs unchanged, same split as the dashboard's (portal) group) and the
// notifications route carries its own SchoolStaffGuard layout. Shell chrome
// comes from the dashboard layout above; this boundary adds only the role
// gate.
export default function TeachLayout({ children }: { children: ReactNode }) {
  return <TeacherGuard>{children}</TeacherGuard>;
}
