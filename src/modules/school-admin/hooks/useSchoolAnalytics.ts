'use client';

import { useAuthStore } from '@/modules/auth';
import { useSchoolClassesQuery } from '@/modules/classes';
import { TRIAL_PLAN } from '@/modules/school-admin/constants/analytics.constants';
import {
  countStudentsTested,
  readingTestsAllowed,
  readingTestsCompleted,
} from '@/modules/school-admin/lib/school-analytics';
import { useEntitlementQuery } from '@/modules/school-admin/queries/use-entitlement.query';
import { useMySchoolQuery } from '@/modules/school-admin/queries/use-my-school.query';
import { useParticipationQuery } from '@/modules/school-admin/queries/use-participation.query';

import type { SchoolAnalytics } from '@/modules/school-admin/types/hooks.types';

// The read-only School analytics home (spec section 1). Four reads in
// parallel: C-SCH-01 for the header, C-ENT-01 for the plan's reading
// allowance, C-RPT-04 for completion and C-CLS-01 for the class list. Any one
// of them pending or failing gates the whole screen, so a partial page can
// never imply a figure that has not loaded.
export function useSchoolAnalytics(): SchoolAnalytics {
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const enabled = hydrated && Boolean(token);

  const schoolQuery = useMySchoolQuery(enabled);
  const entitlementQuery = useEntitlementQuery(enabled);
  const participationQuery = useParticipationQuery(enabled);
  const classesQuery = useSchoolClassesQuery(enabled);

  const isPending =
    schoolQuery.isPending ||
    entitlementQuery.isPending ||
    participationQuery.isPending ||
    classesQuery.isPending;
  const isError =
    schoolQuery.isError ||
    entitlementQuery.isError ||
    participationQuery.isError ||
    classesQuery.isError;
  const isFetching =
    schoolQuery.isFetching ||
    entitlementQuery.isFetching ||
    participationQuery.isFetching ||
    classesQuery.isFetching;

  function refetch(): void {
    void schoolQuery.refetch();
    void entitlementQuery.refetch();
    void participationQuery.refetch();
    void classesQuery.refetch();
  }

  const school = schoolQuery.data;
  const entitlement = entitlementQuery.data;
  const participation = participationQuery.data;
  const classes = classesQuery.data;

  if (!school || !entitlement || !participation || !classes) {
    return { isPending, isError, isFetching, refetch, data: null };
  }

  return {
    isPending,
    isError,
    isFetching,
    refetch,
    data: {
      school,
      classes,
      studentsTested: countStudentsTested(participation),
      readingTestsCompleted: readingTestsCompleted(entitlement),
      readingTestsAllowed: readingTestsAllowed(entitlement),
      isTrial: school.plan === TRIAL_PLAN,
    },
  };
}
