'use client';

import { useEffect } from 'react';

import { usePathname, useRouter } from '@/i18n/navigation';
import { useAuth } from '@/modules/auth/hooks/use-auth';

// The parent slug the API gates on; role.constants.ts ships only the staff
// slugs, and DashboardOnboardingGuard reads the parent slug the same way.
const PARENT_ROLE_TYPE = 'parent';

// Mirrors REPORTS_HREF in @/modules/shell/constants/nav.constants.ts. Read
// locally: the shell barrel already imports the auth barrel (role constants),
// so an auth -> shell import would close a circular module pair.
const TEACHER_REPORTS_PATH = '/dashboard/reports';

export type ParentViewsGate = 'loading' | 'pass' | 'unavailable' | 'redirect';

// Task 46 (st-mvp-pivot): with PARENT_VIEWS_ENABLED off the parent portal is
// masked, not deleted. A resolved parent gets the not-available state wherever
// in the portal tree they land; a staff role keeps /dashboard itself (the
// DashboardRoleGate there hands them their own section) and the teacher
// reports subtree, and is redirected to /dashboard from every other
// parent-only route. When the me read fails the gate falls through to the
// legacy behaviour, the same precedent DashboardRoleGate sets. The caller only
// consults this hook while the flag is off; flag ON never reaches it.
export function useParentViewsGate(active: boolean): ParentViewsGate {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const roleType = user?.role?.type;
  let gate: ParentViewsGate = 'pass';

  if (active) {
    if (pathname.startsWith(TEACHER_REPORTS_PATH)) {
      gate = 'pass';
    } else if (isLoading || (user !== null && roleType === undefined)) {
      gate = 'loading';
    } else if (roleType === PARENT_ROLE_TYPE) {
      gate = 'unavailable';
    } else if (user === null || pathname === '/dashboard') {
      gate = 'pass';
    } else {
      gate = 'redirect';
    }
  }

  useEffect(() => {
    if (gate === 'redirect') router.replace('/dashboard');
  }, [gate, router]);

  return gate;
}
