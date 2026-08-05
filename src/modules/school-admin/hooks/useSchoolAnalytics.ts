'use client';

import { useAuthStore } from '@/modules/auth';
import { useSchoolClassesQuery } from '@/modules/classes';
import { TRIAL_PLAN } from '@/modules/school-admin/constants/analytics.constants';
import { useMySchoolQuery } from '@/modules/school-admin/queries/use-my-school.query';
import { useSchoolAnalyticsQuery } from '@/modules/school-admin/queries/use-school-analytics.query';

import type { SchoolAnalytics } from '@/modules/school-admin/types/hooks.types';

// The read-only School analytics home (spec section 1). Three reads in
// parallel: C-SCH-01 for the header, C-RPT-06 for every metric card, and
// C-CLS-01 for the class list. Every card figure now comes off the ONE C-RPT-06
// payload — no card is composed from a second endpoint, so the page can never
// show two figures measured at different instants. Any one read pending or
// failing gates the whole screen, so a partial page can never imply a figure
// that has not loaded.
export function useSchoolAnalytics(): SchoolAnalytics {
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const enabled = hydrated && Boolean(token);

  const schoolQuery = useMySchoolQuery(enabled);
  const summaryQuery = useSchoolAnalyticsQuery(enabled);
  const classesQuery = useSchoolClassesQuery(enabled);

  const isPending = schoolQuery.isPending || summaryQuery.isPending || classesQuery.isPending;
  const isError = schoolQuery.isError || summaryQuery.isError || classesQuery.isError;
  const isFetching = schoolQuery.isFetching || summaryQuery.isFetching || classesQuery.isFetching;

  function refetch(): void {
    void schoolQuery.refetch();
    void summaryQuery.refetch();
    void classesQuery.refetch();
  }

  const school = schoolQuery.data;
  const summary = summaryQuery.data;
  const classes = classesQuery.data;

  if (!school || !summary || !classes) {
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
      summary,
      isTrial: school.plan === TRIAL_PLAN,
    },
  };
}
