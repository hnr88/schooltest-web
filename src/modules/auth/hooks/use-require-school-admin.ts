'use client';

import { useEffect } from 'react';

import { usePathname, useRouter } from '@/i18n/navigation';
import { PARENT_ROLE_TYPE } from '@/modules/auth/constants/hooks.constants';
import { SCHOOL_ADMIN_ROLE_TYPE } from '@/modules/auth/constants/role.constants';
import { useMeQuery } from '@/modules/auth/queries/use-me.query';
import { useAuthStore } from '@/modules/auth/stores/use-auth-store';
// NIGHT-2 AUTH-018: the anonymous bounce carries the attempted route
// so sign-in can return the visitor to where they were heading.
import { signInHref } from '@/modules/auth/lib/sign-in-redirect';

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
  const pathname = usePathname();

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
    if (hydrated && !hasToken) router.replace(signInHref(pathname));
  }, [hydrated, hasToken, pathname, router]);

  useEffect(() => {
    if (!isResolved) return;
    if (isRejected) {
      router.replace(signInHref(pathname));
      return;
    }
    // NIGHT-2 (W8): a resolved PARENT keeps the guard mounted so the caller
    // renders ParentViewsUnavailable (the mask, not a silent redirect).
    if (!isSchoolAdmin) {
      if (roleType === PARENT_ROLE_TYPE) return;
      router.replace('/dashboard');
    }
  }, [isResolved, isRejected, isSchoolAdmin, pathname, roleType, router]);

  return {
    isReady: isResolved && !isRejected && isSchoolAdmin,
    isSchoolAdmin,
    roleType,
  };
}
