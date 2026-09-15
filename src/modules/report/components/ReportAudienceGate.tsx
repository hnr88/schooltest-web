'use client';

import { useEffect } from 'react';

import type { ReactNode } from 'react';

import { useRouter } from '@/i18n/navigation';
import { OpsSessionExpiredCard } from '@/modules/auth/components/OpsSessionExpiredCard';
import { ParentViewsUnavailable } from '@/modules/auth/components/ParentViewsUnavailable';
import { PARENT_ROLE_TYPE } from '@/modules/auth/constants/hooks.constants';
import { useRequireOps } from '@/modules/auth/hooks/use-require-ops';
import { useRequireSchoolAdmin } from '@/modules/auth/hooks/use-require-school-admin';
import { useRequireTeacher } from '@/modules/auth/hooks/use-require-teacher';
import { useMeQuery } from '@/modules/auth/queries/use-me.query';
import { useAuthStore } from '@/modules/auth/stores/use-auth-store';
import { Skeleton } from '@/modules/design-system';
import { parentViewsEnabled } from '@/modules/flags';

import type { ReportAudienceGateProps } from '@/modules/report/types/report-view.types';

function GateSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-6 py-12">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

/**
 * C-PAR-REPORT (NIGHT-2 W8) — the ONE reports audience the two /dashboard/reports
 * routes serve. The routes used to be teacher-only (TeacherGuard + a silent
 * redirect for every other role), which is the root of the night-1 family-report
 * FAIL: with the portal unmasked a signed-in PARENT could never see their own
 * child's released report. The resolved caller now picks the arm:
 * - parent            → the family face (`parent` slot — the C-PAR-REPORT reads);
 * - teacher/SA/ops    → the staff face (`staff` slot — TeacherGuard semantics,
 *   byte-identical: the mounted guards still own their redirects/expired card);
 * - any other role    → the honest ParentViewsUnavailable mask instead of a
 *   redirect that looks like a broken link (the same rule the staff guards use),
 *   or the /dashboard bounce while the portal flag is off (the pre-W8 posture).
 * Unauthenticated keeps the /sign-in bounce. While /api/users/me is in flight
 * the skeleton stands in — neither arm flashes (the dashboard role gates'
 * precedent). An EXPIRED session never redirects: the expired card renders over
 * the kept-alive tree (GAP-6, same as TeacherGuard/OpsGuard).
 */
export function ReportAudienceGate({ staff, parent }: ReportAudienceGateProps) {
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const hydrate = useAuthStore((state) => state.hydrate);
  const sessionExpired = useAuthStore((state) => state.sessionExpired);
  const router = useRouter();
  // NIGHT-2 (W-R4, TEA-063): `bounce: false` on all three — this gate mounts
  // them simultaneously, so each non-matching hook's wrong-role bounce would
  // yank the caller off the page the instant /api/users/me resolved (a teacher
  // landed on /dashboard/reports and was immediately sent to /dashboard, then
  // /dashboard/results — the reports list was unreachable for every role).
  // Arm selection and routing stay here, below, where the resolved role is known.
  const teacher = useRequireTeacher({ bounce: false });
  const schoolAdmin = useRequireSchoolAdmin({ bounce: false });
  const ops = useRequireOps({ bounce: false });

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  const hasToken = Boolean(token);
  const meQuery = useMeQuery(hydrated && hasToken);
  const roleType = meQuery.data?.role?.type ?? null;
  const isStaffRole = teacher.isTeacher || schoolAdmin.isSchoolAdmin || ops.isOps;
  const isResolved = hydrated && hasToken && !meQuery.isPending;
  const isRejected = meQuery.isError;

  useEffect(() => {
    if (sessionExpired) return;
    if (hydrated && !hasToken) router.replace('/sign-in');
  }, [sessionExpired, hydrated, hasToken, router]);

  useEffect(() => {
    if (sessionExpired) return;
    if (!isResolved) return;
    if (isRejected) {
      router.replace('/sign-in');
      return;
    }
    // A resolved role with no reports arm at all (e.g. the student app role)
    // has no reports face anywhere — send them to the dashboard they can open.
    if (!isStaffRole && roleType !== PARENT_ROLE_TYPE) router.replace('/dashboard');
  }, [sessionExpired, isResolved, isRejected, isStaffRole, roleType, router]);

  // GAP-6: an expired session is the one state that must not redirect or swap
  // arms — the card names why, over the kept-alive tree.
  if (sessionExpired) {
    return (
      <>
        <GateSkeleton />
        <OpsSessionExpiredCard />
      </>
    );
  }

  if (!hydrated || !hasToken || meQuery.isPending || isRejected) {
    return <GateSkeleton />;
  }

  if (roleType === PARENT_ROLE_TYPE) {
    // Flag off → the pre-W8 masked posture for parents; flag on → the family face.
    return parentViewsEnabled() ? <>{parent}</> : <ParentViewsUnavailable />;
  }

  if (teacher.isReady || schoolAdmin.isReady || ops.isReady) {
    return <>{staff}</>;
  }

  // Resolved, but neither a parent nor staff: the staff-guard hooks are still
  // bouncing this caller to /dashboard — hold the skeleton meanwhile.
  return <GateSkeleton />;
}
