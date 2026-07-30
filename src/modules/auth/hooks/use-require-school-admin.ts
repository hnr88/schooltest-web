'use client';

import { useEffect } from 'react';

import { useRouter } from '@/i18n/navigation';
import { SCHOOL_ADMIN_ROLE_TYPE } from '@/modules/auth/constants/role.constants';
import { useMeQuery } from '@/modules/auth/queries/use-me.query';
import { useAuthStore } from '@/modules/auth/stores/use-auth-store';

// Client guard primitive for school_admin-only routes: hydrates the JWT from
// localStorage, then resolves the identity through GET /api/users/me — whose
// payload already carries `role.type` — and sends anyone who is not a school
// admin back to a route they can actually open. This is navigation hygiene
// only; the school-scoped API routes answer 403 to a wrong-role JWT regardless
// (task 07).
export function useRequireSchoolAdmin() {
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const hydrate = useAuthStore((state) => state.hydrate);
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  const hasToken = Boolean(token);
  const meQuery = useMeQuery(hydrated && hasToken);
  const roleType = meQuery.data?.role?.type ?? null;
  const isSchoolAdmin = roleType === SCHOOL_ADMIN_ROLE_TYPE;
  const isResolved = hydrated && hasToken && !meQuery.isPending;
  const isRejected = meQuery.isError;

  useEffect(() => {
    if (hydrated && !hasToken) router.replace('/sign-in');
  }, [hydrated, hasToken, router]);

  useEffect(() => {
    if (!isResolved) return;
    if (isRejected) {
      router.replace('/sign-in');
      return;
    }
    if (!isSchoolAdmin) router.replace('/dashboard');
  }, [isResolved, isRejected, isSchoolAdmin, router]);

  return {
    isReady: isResolved && !isRejected && isSchoolAdmin,
    isSchoolAdmin,
    roleType,
  };
}
