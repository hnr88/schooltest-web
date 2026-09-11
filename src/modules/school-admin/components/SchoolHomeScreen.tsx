'use client';

import { useTranslations } from 'next-intl';

import { Alert, Button, Skeleton } from '@/modules/design-system';
import { SchoolClassesSection } from '@/modules/school-admin/components/SchoolClassesSection';
import { SchoolDiagnosticsSection } from '@/modules/school-admin/components/SchoolDiagnosticsSection';
import { SchoolProgressSection } from '@/modules/school-admin/components/SchoolProgressSection';
import { SchoolReadinessSection } from '@/modules/school-admin/components/SchoolReadinessSection';
import { useSchoolAnalytics } from '@/modules/school-admin/hooks/useSchoolAnalytics';
import type {
  SchoolAccountStatus,
  SchoolOnboardingStatus,
} from '@/modules/school-admin/types/school-admin.types';

// Header status pills (School Admin Portal.dc.html:108-109): 13/600 ink on a
// tinted full-round pill with a 7px dot in the pill's own ink. Only `active`
// and `complete` are depicted; the other states borrow the app's existing
// status tints (the same families AccountDetailsCard's badges use).
const ACCOUNT_PILL_TONES: Record<SchoolAccountStatus, string> = {
  active: 'bg-success-soft text-success-strong',
  invited: 'bg-blue-50 text-blue-700',
  invoiced: 'bg-blue-50 text-blue-700',
  prospect: 'bg-surface-well text-foreground',
  suspended: 'bg-warning-soft text-warning-strong',
  closed: 'bg-danger-soft text-danger-strong',
};

// The artboard's two onboarding states verbatim: complete is neutral navy on
// #E8ECF4, everything else is amber (#92610B on #FDF3E0).
const ONBOARDING_PILL_TONES: Record<SchoolOnboardingStatus, string> = {
  complete: 'bg-surface-well text-foreground',
  submitted: 'bg-warning-soft text-warning-strong',
  in_progress: 'bg-warning-soft text-warning-strong',
  link_sent: 'bg-warning-soft text-warning-strong',
  not_started: 'bg-warning-soft text-warning-strong',
};

// School analytics home (School Admin Portal.dc.html VIEW 1): the default
// landing page, read-only throughout — no editable control, no drill-down, no
// export. The class rows are the only navigation. Plan and seats moved to the
// Account section.
export function SchoolHomeScreen() {
  const t = useTranslations('SchoolAdmin');
  const analytics = useSchoolAnalytics();

  if (analytics.isPending) {
    return (
      <main className="flex flex-1 flex-col gap-5.5 px-4 py-6 sm:px-6 lg:px-8">
        <Skeleton className="h-9 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </main>
    );
  }

  if (analytics.isError || !analytics.data) {
    return (
      <main className="flex flex-1 flex-col gap-5.5 px-4 py-6 sm:px-6 lg:px-8">
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

  const { school, classes, summary, isTrial } = analytics.data;

  return (
    <main
      data-slot="school-home"
      data-surface="school-admin-home"
      className="flex flex-1 flex-col gap-5.5 px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="text-h2 font-medium text-foreground">{school.name}</h1>
          <p className="mt-2 text-lede text-muted-foreground">{t('home.subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3.75 py-2 text-caption font-semibold ${ACCOUNT_PILL_TONES[school.account_status]}`}
          >
            <span aria-hidden="true" className="size-1.75 rounded-full bg-current" />
            {t(`accountStatus.${school.account_status}`)}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-3.75 py-2 text-caption font-semibold ${ONBOARDING_PILL_TONES[school.onboarding_status]}`}
          >
            {t('home.onboardingStatusLabel')} {t(`onboardingStatus.${school.onboarding_status}`)}
          </span>
        </div>
      </div>
      <SchoolDiagnosticsSection summary={summary} />
      <SchoolProgressSection summary={summary} />
      {isTrial ? <SchoolReadinessSection /> : null}
      <SchoolClassesSection classes={classes} />
    </main>
  );
}
