'use client';

import { useEffect } from 'react';

import { usePathname, useRouter } from '@/i18n/navigation';
import { PARENT_ROLE_TYPE } from '@/modules/auth/constants/hooks.constants';
import { SCHOOL_ADMIN_ROLE_TYPE } from '@/modules/auth/constants/role.constants';
import { isAuthRejection, useMeQuery } from '@/modules/auth/queries/use-me.query';
import { useAuthStore } from '@/modules/auth/stores/use-auth-store';
// NIGHT-2 AUTH-018: the anonymous bounce carries the attempted route
// so sign-in can return the visitor to where they were heading.
import { signInHref } from '@/modules/auth/lib/sign-in-redirect';
import type { RequireRoleOptions } from '@/modules/auth/types/hooks.types';

// Client guard primitive for school_admin-only routes: hydrates the JWT from
// localStorage, then resolves the identity through GET /api/users/me — whose
// payload already carries `role.type` — and sends anyone who is not a school
// admin back to a route they can actually open. This is navigation hygiene
// only; the school-scoped API routes answer 403 to a wrong-role JWT regardless
// (task 07).
// NIGHT-2 (W-R4, TEA-063): `bounce: false` for multi-role audience gates.
export function useRequireSchoolAdmin({ bounce = true }: RequireRoleOptions = {}) {
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
      // NIGHT-2 (W-R3): a TRANSIENT me failure (transport reset, exhausted 429,
      // recompile-window 5xx) is not a sign-out — only a true auth rejection
      // (401 / unauthenticated 403) ends the session. Bouncing on any error
      // ejected signed-in admins to the login form under load.
      if (!isAuthRejection(meQuery.error)) return;
      router.replace(signInHref(pathname));
      return;
    }
    // NIGHT-2 (W8): a resolved PARENT keeps the guard mounted so the caller
    // renders ParentViewsUnavailable (the mask, not a silent redirect).
    // NIGHT-2 (W-R4): unless the caller opted out (multi-role audience gate).
    if (!isSchoolAdmin && bounce) {
      if (roleType === PARENT_ROLE_TYPE) return;
      router.replace('/dashboard');
    }
  }, [isResolved, isRejected, isSchoolAdmin, meQuery.error, pathname, roleType, router]);

  return {
    isReady: isResolved && !isRejected && isSchoolAdmin,
    isSchoolAdmin,
    roleType,
  };
}
