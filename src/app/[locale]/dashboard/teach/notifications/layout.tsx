import type { ReactNode } from 'react';

import { SchoolStaffGuard } from '@/modules/auth';

// Notifications is the ONE school-staff route under /dashboard/teach (D-16a,
// task 113): C-NOT-01 serves both teacher and school_admin (the API's
// global::is-school-staff policy), so the bell's view-all can land either role
// here. Every other teach route stays teacher-only inside the (teacher) group.
export default function TeachNotificationsLayout({ children }: { children: ReactNode }) {
  return <SchoolStaffGuard>{children}</SchoolStaffGuard>;
}
