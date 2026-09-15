'use client';

import { useEffect } from 'react';

import { usePathname, useRouter } from '@/i18n/navigation';
import { PARENT_ROLE_TYPE } from '@/modules/auth/constants/hooks.constants';
import { TEACHER_ROLE_TYPE } from '@/modules/auth/constants/role.constants';
import { useMeQuery } from '@/modules/auth/queries/use-me.query';
import { useAuthStore } from '@/modules/auth/stores/use-auth-store';
// NIGHT-2 AUTH-018: the anonymous bounce carries the attempted route
// so sign-in can return the visitor to where they were heading.
import { signInHref } from '@/modules/auth/lib/sign-in-redirect';
import type { RequireRoleOptions } from '@/modules/auth/types/hooks.types';

// Client guard primitive for teacher-only routes (F-WEB-TEACHER-REPORT):
// hydrates the JWT from localStorage, then resolves the identity through
// GET /api/users/me — whose payload already carries `role.type` — and sends
// anyone who is not a teacher back to a route they can actually open. This is
// navigation hygiene only; C-4/C-11 answer 403 to a wrong-role JWT regardless.
// NIGHT-2 (W-R4, TEA-063): `bounce: false` for multi-role audience gates.
export function useRequireTeacher({ bounce = true }: RequireRoleOptions = {}) {
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const hydrate = useAuthStore((state) => state.hydrate);
  // U-25 (GAP-6): the design-drawn expired state. While it stands, the guard
  // stops bounce-redirecting — the caller renders the session-expired card over
  // the kept-alive tree instead of yanking the teacher to /sign-in. Mirrors
  // use-require-ops.ts line for line.
  const sessionExpired = useAuthStore((state) => state.sessionExpired);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  const hasToken = Boolean(token);
  const meQuery = useMeQuery(hydrated && hasToken);
  const roleType = meQuery.data?.role?.type ?? null;
  const isTeacher = roleType === TEACHER_ROLE_TYPE;
  const isResolved = hydrated && hasToken && !meQuery.isPending;
  const isRejected = meQuery.isError;

  useEffect(() => {
    if (sessionExpired) return;
    if (hydrated && !hasToken) router.replace(signInHref(pathname));
  }, [sessionExpired, hydrated, hasToken, pathname, router]);

  useEffect(() => {
    if (sessionExpired) return;
    if (!isResolved) return;
    if (isRejected) {
      router.replace(signInHref(pathname));
      return;
    }
    // Security finding 3: a signed-in non-teacher must not see the content
    // while nothing redirects — send them somewhere their role can open.
    // NIGHT-2 (W8): except a resolved PARENT — the guard stays mounted so the
    // caller can render ParentViewsUnavailable (the mask, not an error, and
    // not a silent redirect that looks like a broken link).
    // NIGHT-2 (W-R4): unless the caller opted out (multi-role audience gate).
    if (!isTeacher && bounce) {
      if (roleType === PARENT_ROLE_TYPE) return;
      router.replace('/dashboard');
    }
  }, [sessionExpired, isResolved, isRejected, isTeacher, pathname, roleType, router]);

  return {
    isReady: isResolved && !isRejected && isTeacher,
    isTeacher,
    roleType,
    sessionExpired,
  };
}
