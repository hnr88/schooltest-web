import type { ReactNode } from 'react';

import { SchoolStaffGuard } from '@/modules/auth';

// School-staff notification settings (notifications/06, D-08). The SECOND
// school-staff route under /dashboard/teach, beside notifications: the API
// grants GET/PUT /api/notification-preferences/me and the whole push set to
// EVERY app role (NOTIFICATION_SURFACE_ACTIONS), and dispatch gates the
// staff-recipient events on exactly those preferences — so staff notifications
// were being filtered by settings staff could not see. SchoolStaffGuard admits
// teacher AND school_admin (use-require-school-staff.ts), which mirrors that
// grant, so one route serves both roles — the precedent D-16a set for the
// staff feed.
//
// DELIBERATELY NOT UNDER (portal), and this is the whole point of the row:
// that group is ParentGuard + the parent-views gate, and
// NEXT_PUBLIC_PARENT_VIEWS_ENABLED ships 'false' (src/lib/env.ts:16), so
// /dashboard/settings is masked for everyone in the shipped default (D-08a).
// This route consults no flag and never calls parentViewsEnabled().
export default function TeachSettingsLayout({ children }: { children: ReactNode }) {
  return <SchoolStaffGuard>{children}</SchoolStaffGuard>;
}
