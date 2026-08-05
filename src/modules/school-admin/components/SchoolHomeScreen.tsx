'use client';

import { useTranslations } from 'next-intl';

import { Alert, Button, Skeleton } from '@/modules/design-system';
import { SchoolClassesSection } from '@/modules/school-admin/components/SchoolClassesSection';
import { SchoolDiagnosticsSection } from '@/modules/school-admin/components/SchoolDiagnosticsSection';
import { SchoolProgressSection } from '@/modules/school-admin/components/SchoolProgressSection';
import { SchoolReadinessSection } from '@/modules/school-admin/components/SchoolReadinessSection';
import { useSchoolAnalytics } from '@/modules/school-admin/hooks/useSchoolAnalytics';

// School analytics home (spec section 1): the default landing page, read-only
// throughout — no editable control, no drill-down, no export. The class rows
// are the only navigation. Plan and seats moved to the Account section.
export function SchoolHomeScreen() {
  const t = useTranslations('SchoolAdmin');
  const analytics = useSchoolAnalytics();

  if (analytics.isPending) {
    return (
      <main className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Skeleton className="h-9 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </main>
    );
  }

  if (analytics.isError || !analytics.data) {
    return (
      <main className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Alert
          variant="error"
          title={t('home.errorTitle')}
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={analytics.isFetching}
              onClick={analytics.refetch}
            >
              {t('home.retry')}
            </Button>
          }
        >
          {t('home.errorDescription')}
        </Alert>
      </main>
    );
  }

  const { school, classes, studentsTested, readingTestsCompleted, readingTestsAllowed, isTrial } =
    analytics.data;
  const location = [school.suburb, school.state, school.postcode]
    .filter((part): part is string => Boolean(part))
    .join(' ');

  return (
    <main
      data-slot="school-home"
      data-surface="school-admin-home"
      className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">{school.name}</h1>
        {location ? <p className="text-sm text-body">{location}</p> : null}
      </div>
      <SchoolDiagnosticsSection
        studentsTested={studentsTested}
        readingTestsCompleted={readingTestsCompleted}
        readingTestsAllowed={readingTestsAllowed}
      />
      <SchoolProgressSection readingTestsAllowed={readingTestsAllowed} />
      {isTrial ? <SchoolReadinessSection /> : null}
      <SchoolClassesSection classes={classes} />
    </main>
  );
}
