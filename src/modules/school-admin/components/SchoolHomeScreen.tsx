'use client';

import { useTranslations } from 'next-intl';

import { useAuthStore } from '@/modules/auth';
import { Alert, Badge, Button, Skeleton } from '@/modules/design-system';
import { SchoolEntitlementSection } from '@/modules/school-admin/components/SchoolEntitlementSection';
import { ACCOUNT_STATUS_VARIANTS, ONBOARDING_STATUS_VARIANTS } from '@/modules/school-admin/constants/lib.constants';
import { useMySchoolQuery } from '@/modules/school-admin/queries/use-my-school.query';

// School administrator section index (tasks 27-28, st-mvp-pivot): the caller's
// own school from C-SCH-01 — name, location line, the two lifecycle chips —
// plus the C-ENT-01 plan/seats/allowance panel.
export function SchoolHomeScreen() {
  const t = useTranslations('SchoolAdmin');
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const schoolQuery = useMySchoolQuery(hydrated && Boolean(token));

  if (schoolQuery.isPending) {
    return (
      <main className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Skeleton className="h-9 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-6 w-64" />
      </main>
    );
  }

  if (schoolQuery.isError) {
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
              loading={schoolQuery.isFetching}
              onClick={() => schoolQuery.refetch()}
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

  const school = schoolQuery.data;
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
        <p className="text-sm text-body">{t('home.subtitle')}</p>
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <span className="inline-flex items-center gap-2 text-sm text-body">
          {t('home.accountStatusLabel')}
          <Badge variant={ACCOUNT_STATUS_VARIANTS[school.account_status]}>
            {t(`accountStatus.${school.account_status}`)}
          </Badge>
        </span>
        <span className="inline-flex items-center gap-2 text-sm text-body">
          {t('home.onboardingStatusLabel')}
          <Badge variant={ONBOARDING_STATUS_VARIANTS[school.onboarding_status]}>
            {t(`onboardingStatus.${school.onboarding_status}`)}
          </Badge>
        </span>
      </div>
      <SchoolEntitlementSection />
    </main>
  );
}
