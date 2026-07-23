'use client';

import { useEffect } from 'react';

import { useRouter } from '@/i18n/navigation';
import { TEACHER_ROLE_TYPE } from '@/modules/auth/constants/role.constants';
import { useMeQuery } from '@/modules/auth/queries/use-me.query';
import { useAuthStore } from '@/modules/auth/stores/use-auth-store';

// Client guard primitive for teacher-only routes (F-WEB-TEACHER-REPORT):
// hydrates the JWT from localStorage, then resolves the identity through
// GET /api/users/me — whose payload already carries `role.type` — and sends
// anyone who is not a teacher back to a route they can actually open. This is
// navigation hygiene only; C-4/C-11 answer 403 to a wrong-role JWT regardless.
export function useRequireTeacher() {
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
  const isTeacher = roleType === TEACHER_ROLE_TYPE;
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
    if (!isTeacher) router.replace('/dashboard');
  }, [isResolved, isRejected, isTeacher, router]);

  return {
    isReady: isResolved && !isRejected && isTeacher,
    isTeacher,
    roleType,
  };
}
