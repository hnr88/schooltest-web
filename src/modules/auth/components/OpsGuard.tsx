'use client';

import type { ReactNode } from 'react';

import { useAuthStore } from '@/modules/auth/stores/use-auth-store';
import { OpsSessionExpiredCard } from '@/modules/auth/components/OpsSessionExpiredCard';
import { useRequireOps } from '@/modules/auth/hooks/use-require-ops';
import { Skeleton } from '@/modules/design-system';

import type { OpsGuardProps } from '@/modules/auth/types/components.types';

// Gate for ops-only routes (/dashboard/ops/*): a loading skeleton while the
// token hydrates and /api/users/me resolves, then either the guarded content
// or nothing at all while useRequireOps redirects — /sign-in with no (or a
// rejected) token, /dashboard for a signed-in non-ops role.
//
// GAP-6: an EXPIRED session is the one state that must not redirect. The
// axios boundary raises the store's sessionExpired flag on the first
// auth-invalid response; the guard then renders the design-drawn expired card
// over the kept-alive tree — the operator sees why, and their screen is not
// yanked away. A deliberate sign-out never raises the flag, so the normal
// redirect paths are untouched.
export function OpsGuard({ children }: OpsGuardProps) {
  const { isReady } = useRequireOps();
  const sessionExpired = useAuthStore((state) => state.sessionExpired);

  const content = isReady ? (
    children
  ) : (
    <div
      data-slot="ops-guard-pending"
      className="mx-auto flex w-full max-w-5xl flex-1 animate-in flex-col gap-4 px-6 py-12 duration-300 ease-out-expo fade-in motion-reduce:animate-none"
    >
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-48 w-full" />
    </div>
  );

  if (sessionExpired) {
    return (
      <>
        {content}
        <OpsSessionExpiredCard />
      </>
    );
  }

  return content;
}
