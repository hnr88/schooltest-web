'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { TEACHER_ROLE_TYPE, useAuth } from '@/modules/auth';
import type { TeacherDashboardGateProps } from '@/modules/teacher/types/teacher-dashboard.types';

// A4 (.qa/DECISIONS.md): `/dashboard` is ONE route serving two personas — the
// teacher class cards for `role.type === 'teacher'`, the incumbent parent
// Overview for everyone else. The switch has to be a client component because
// the identity lives behind the JWT in localStorage, and it resolves through the
// SAME `GET /api/users/me` read every other guard in this app already uses.
//
// The branches arrive as ReactNode, so only ONE of them ever mounts: before this
// existed the parent Overview mounted for a teacher too and its parent-only
// students read answered 403, putting a "Could not load your students." error in
// front of every teacher. Nothing is rendered while the role is unknown — a role
// flash would show a persona their account cannot use.
function TeacherDashboardGate({ teacher, fallback }: TeacherDashboardGateProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div data-slot="dashboard-persona-pending" className="flex flex-col gap-4 px-4 py-6 sm:px-6">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-56 w-full rounded-card" />
      </div>
    );
  }

  return <>{user?.role?.type === TEACHER_ROLE_TYPE ? teacher : fallback}</>;
}

export { TeacherDashboardGate };
