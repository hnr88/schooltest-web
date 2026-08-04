'use client';

import type { ReactNode } from 'react';

import { useRequireOps } from '@/modules/auth/hooks/use-require-ops';
import { Skeleton } from '@/modules/design-system';

import type { OpsGuardProps } from '@/modules/auth/types/components.types';

// Gate for ops-only routes (/dashboard/ops/*): a loading skeleton while the
// token hydrates and /api/users/me resolves, then either the guarded content
// or nothing at all while useRequireOps redirects — /sign-in with no (or a
// rejected) token, /dashboard for a signed-in non-ops role.
export function OpsGuard({ children }: OpsGuardProps) {
  const { isReady } = useRequireOps();

  if (!isReady) {
    return (
      <div
        data-slot="ops-guard-pending"
        className="mx-auto flex w-full max-w-5xl flex-1 animate-in flex-col gap-4 px-6 py-12 duration-300 ease-out-expo fade-in motion-reduce:animate-none"
      >
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return <>{children}</>;
}
