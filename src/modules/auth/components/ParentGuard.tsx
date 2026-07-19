'use client';

import type { ReactNode } from 'react';

import { useRequireParent } from '@/modules/auth/hooks/use-require-parent';
import { Skeleton } from '@/modules/design-system';

interface ParentGuardProps {
  children: ReactNode;
}

// Gate for parent-only routes: shows a loading skeleton while the auth store
// hydrates, then either renders the guarded content or renders nothing while
// useRequireParent redirects an unauthenticated visitor to /sign-in.
export function ParentGuard({ children }: ParentGuardProps) {
  const { isReady, isAuthenticated } = useRequireParent();

  if (!isReady) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-6 py-16">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
