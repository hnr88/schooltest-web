'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';

import { useRouter } from '@/i18n/navigation';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { Skeleton } from '@/modules/design-system';
import { useOnboardingStateQuery } from '@/modules/onboarding/queries/use-onboarding-state.query';

interface DashboardOnboardingGuardProps {
  children: ReactNode;
}

const PARENT_ROLE_TYPE = 'parent';

// Blocks the parent dashboard until onboarding is resolved. If the caller is a
// parent whose onboarding status is pending, they are redirected to
// /onboarding. Non-parents and parents with completed/skipped onboarding see
// the dashboard normally. The guard lives inside ParentGuard so auth is already
// guaranteed by the time this component renders.
export function DashboardOnboardingGuard({ children }: DashboardOnboardingGuardProps) {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const isParent = user?.role?.type === PARENT_ROLE_TYPE;

  // Only a PARENT has an onboarding state, and only `isParent && isPending` can
  // redirect — so asking for it as any other role is a read whose answer is
  // discarded. `GET /api/users/me/onboarding` is parent-only and answers 403 to a
  // teacher, which TanStack then retried three times: the guard sat in
  // `isChecking` for ~7.8s of exponential backoff and painted a BLANK dashboard
  // for every teacher before their page could mount. Gating on `isParent` keeps
  // the parent path byte-identical and stops the forbidden read being issued at all.
  const { data: onboarding, isLoading: isOnboardingLoading } = useOnboardingStateQuery({
    enabled: !isAuthLoading && isParent,
  });

  const isPending = onboarding?.status === 'pending';
  const isChecking = isAuthLoading || isOnboardingLoading;
  // A known-pending parent IS leaving for /onboarding — painting children here
  // (even for the single frame before the effect fires) flashes the real
  // dashboard under the onboarding redirect. Render the skeleton instead;
  // completed/skipped/non-parent outcomes still render children unchanged.
  const willRedirect = isParent && isPending;

  useEffect(() => {
    if (!isChecking && willRedirect) {
      router.replace('/onboarding');
    }
  }, [isChecking, willRedirect, router]);

  if (isChecking || willRedirect) {
    return (
      <div className="flex h-svh w-full items-center justify-center bg-surface-well">
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-6 py-16">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
