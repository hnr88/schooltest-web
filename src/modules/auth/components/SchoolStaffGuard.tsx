'use client';

import type { ReactNode } from 'react';

import { useRequireSchoolStaff } from '@/modules/auth/hooks/use-require-school-staff';
import { Skeleton } from '@/modules/design-system';

import type { SchoolStaffGuardProps } from '@/modules/auth/types/components.types';

// Gate for school-staff routes (D-16a, task 113 - today only
// /dashboard/teach/notifications, which C-NOT-01 serves to both teacher and
// school_admin): a loading skeleton while the token hydrates and
// /api/users/me resolves, then either the guarded content or nothing at all
// while useRequireSchoolStaff redirects - /sign-in with no (or a rejected)
// token, /dashboard for a signed-in non-staff role.
export function SchoolStaffGuard({ children }: SchoolStaffGuardProps) {
  const { isReady } = useRequireSchoolStaff();

  if (!isReady) {
    return (
      <div
        data-slot="school-staff-guard-pending"
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
