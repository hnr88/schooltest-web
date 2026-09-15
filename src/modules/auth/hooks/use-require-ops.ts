'use client';

import { useEffect } from 'react';

import { isOpsPortalRole } from '@schooltest/ops-contracts';

import { usePathname, useRouter } from '@/i18n/navigation';
import { PARENT_ROLE_TYPE } from '@/modules/auth/constants/hooks.constants';
import { useMeQuery } from '@/modules/auth/queries/use-me.query';
import { useAuthStore } from '@/modules/auth/stores/use-auth-store';
// NIGHT-2 AUTH-018: the anonymous bounce carries the attempted route
// so sign-in can return the visitor to where they were heading.
import { signInHref } from '@/modules/auth/lib/sign-in-redirect';
import type { RequireRoleOptions } from '@/modules/auth/types/hooks.types';

// Client guard primitive for ops-only routes (/dashboard/ops/*): hydrates the
// JWT from localStorage, then resolves the identity through GET /api/users/me —
// whose payload already carries `role.type` — and sends anyone who is not ops
// back to a route they can actually open. This is navigation hygiene only; the
// /api/ops routes answer 403 to a wrong-role JWT regardless (global::is-ops).
// NIGHT-2 (W-R4, TEA-063): `bounce: false` for multi-role audience gates.
export function useRequireOps({ bounce = true }: RequireRoleOptions = {}) {
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const hydrate = useAuthStore((state) => state.hydrate);
  // GAP-6: the design-drawn expired state. While it stands, the guard stops
  // bounce-redirecting — the caller renders the session-expired card over the
  // kept-alive tree instead of yanking the operator to /sign-in.
  const sessionExpired = useAuthStore((state) => state.sessionExpired);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  const hasToken = Boolean(token);
  const meQuery = useMeQuery(hydrated && hasToken);
  const roleType = meQuery.data?.role?.type ?? null;
  // OPS-075: the narrow `ops_support` account signs in to the SAME portal — it
  // reads and exports, and the server refuses every write it cannot do. Sending
  // it back to /dashboard would hide a surface it is entitled to see. The
  // shared `isOpsPortalRole` guard keeps this list identical to the API's.
  const isOps = isOpsPortalRole(roleType);
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
    // NIGHT-2 (W8): a resolved PARENT keeps the guard mounted so the caller
    // renders ParentViewsUnavailable (the mask, not a silent redirect).
    // NIGHT-2 (W-R4): unless the caller opted out (multi-role audience gate).
    if (!isOps && bounce) {
      if (roleType === PARENT_ROLE_TYPE) return;
      router.replace('/dashboard');
    }
  }, [sessionExpired, isResolved, isRejected, isOps, pathname, roleType, router]);

  return {
    isReady: isResolved && !isRejected && isOps,
    isOps,
    roleType,
    sessionExpired,
  };
}
