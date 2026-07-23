'use client';

import type { ReactNode } from 'react';

import { useRequireTeacher } from '@/modules/auth/hooks/use-require-teacher';
import { Skeleton } from '@/modules/design-system';

interface TeacherGuardProps {
  children: ReactNode;
}

// Gate for teacher-only routes (F-WEB-TEACHER-REPORT): a loading skeleton while
// the token hydrates and /api/users/me resolves, then either the guarded content
// or nothing at all while useRequireTeacher redirects — /sign-in with no (or a
// rejected) token, /dashboard for a signed-in non-teacher.
export function TeacherGuard({ children }: TeacherGuardProps) {
  const { isReady } = useRequireTeacher();

  if (!isReady) {
    return (
      <div
        data-slot="teacher-guard-pending"
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
