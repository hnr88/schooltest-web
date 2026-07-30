import type { ReactNode } from 'react';

import { SchoolAdminGuard } from '@/modules/auth';

// The /dashboard/school section is school_admin-only (spec §15: dedicated
// school administrator dashboard). Shell chrome comes from the dashboard
// layout above; this boundary adds only the role gate.
export default function SchoolLayout({ children }: { children: ReactNode }) {
  return <SchoolAdminGuard>{children}</SchoolAdminGuard>;
}
