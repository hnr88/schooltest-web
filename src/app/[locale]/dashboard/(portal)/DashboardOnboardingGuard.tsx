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

  // Only a parent has an onboarding state: the API scopes C-ONBOARD-GET to the
  // parent role (task 56), so firing it for staff earns a 403 that TanStack
  // retries three times — a multi-second skeleton on every staff page here.
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
