'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';

import { useRouter } from '@/i18n/navigation';
import {
  OPS_ROLE_TYPE,
  SCHOOL_ADMIN_ROLE_TYPE,
  TEACHER_ROLE_TYPE,
} from '@/modules/auth/constants/role.constants';
import { useMeQuery } from '@/modules/auth/queries/use-me.query';
import { useAuthStore } from '@/modules/auth/stores/use-auth-store';
import { DashboardSkeleton } from '@/modules/dashboard/components/DashboardSkeleton';

// Spec §15 + mvp-updates §4.2: school administrators, teachers and ops get
// dedicated dashboards, so a resolved staff/ops role never sees the parent
// portal — /dashboard hands them straight to their own section. Parents keep
// the existing parent portal unchanged.
const ROLE_DESTINATIONS: Record<string, string> = {
  [SCHOOL_ADMIN_ROLE_TYPE]: '/dashboard/school',
  [TEACHER_ROLE_TYPE]: '/dashboard/teach',
  [OPS_ROLE_TYPE]: '/dashboard/ops',
};

export function DashboardRoleGate({ children }: { children: ReactNode }) {
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const router = useRouter();
  // ParentGuard (the (portal) layout) has already hydrated the store and
  // confirmed a token by the time this renders; mirror its enabled shape so
  // the hook stays correct if the gate is ever reused outside it.
  const meQuery = useMeQuery(hydrated && Boolean(token));

  const roleType = meQuery.data?.role?.type;
  const destination = roleType ? (ROLE_DESTINATIONS[roleType] ?? null) : null;

  useEffect(() => {
    if (destination) router.replace(destination);
  }, [destination, router]);

  // Hold the parent overview back while the role is unresolved: the login
  // mutation seeds ['auth','me'] with the /api/auth/local user, which carries
  // no role, so "has data" is not "role known" until the populated
  // /api/users/me refetch lands. Painting children early would flash the
  // parent portal at school staff for those frames. On error, fall through to
  // the existing parent behaviour rather than trapping the user on a skeleton.
  const awaitingRole =
    !meQuery.isError && (meQuery.isPending || (meQuery.data != null && roleType === undefined));

  if (destination || awaitingRole) {
    return <DashboardSkeleton />;
  }

  return <>{children}</>;
}
