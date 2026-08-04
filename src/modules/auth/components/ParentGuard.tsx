'use client';

import type { ReactNode } from 'react';

import { ParentViewsUnavailable } from '@/modules/auth/components/ParentViewsUnavailable';
import { useParentViewsGate } from '@/modules/auth/hooks/use-parent-views-gate';
import { useRequireParent } from '@/modules/auth/hooks/use-require-parent';
import { Skeleton } from '@/modules/design-system';
import { parentViewsEnabled } from '@/modules/flags';

import type { ParentGuardProps } from '@/modules/auth/types/components.types';

function GuardSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-6 py-16">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

// Gate for parent-only routes: shows a loading skeleton while the auth store
// hydrates, then either renders the guarded content or renders nothing while
// useRequireParent redirects an unauthenticated visitor to /sign-in.
//
// Task 46 (st-mvp-pivot): with PARENT_VIEWS_ENABLED off the parent portal is
// masked, not deleted — a parent sees the not-available state, staff keep the
// teacher reports subtree and are redirected to /dashboard from every other
// parent-only route (useParentViewsGate). Flag ON keeps the legacy behaviour
// byte-for-byte.
export function ParentGuard({ children }: ParentGuardProps) {
  const { isReady, isAuthenticated } = useRequireParent();
  const gate = useParentViewsGate(isReady && isAuthenticated);

  if (!isReady) {
    return <GuardSkeleton />;
  }

  if (!isAuthenticated) return null;

  if (!parentViewsEnabled()) {
    if (gate === 'unavailable') return <ParentViewsUnavailable />;
    if (gate !== 'pass') return <GuardSkeleton />;
  }

  return <>{children}</>;
}
