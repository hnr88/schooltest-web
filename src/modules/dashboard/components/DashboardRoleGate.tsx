'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';

import { useRouter } from '@/i18n/navigation';
import {
  OPS_ROLE_TYPE,
  SCHOOL_ADMIN_ROLE_TYPE,
  TEACHER_ROLE_TYPE,
} from '@/modules/auth';
import { useMeQuery } from '@/modules/auth';
import { useAuthStore } from '@/modules/auth';
import { DashboardSkeleton } from '@/modules/dashboard/components/DashboardSkeleton';
import { ROLE_DESTINATIONS } from '@/modules/dashboard/constants/components.constants';

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
