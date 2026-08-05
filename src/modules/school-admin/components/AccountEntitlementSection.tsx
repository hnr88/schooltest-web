'use client';

import { useTranslations } from 'next-intl';

import { useAuthStore } from '@/modules/auth';
import { Alert, Button, Skeleton } from '@/modules/design-system';
import { AccountAllowanceCard } from '@/modules/school-admin/components/AccountAllowanceCard';
import { AccountPlanCard } from '@/modules/school-admin/components/AccountPlanCard';
import { useEntitlementQuery } from '@/modules/school-admin/queries/use-entitlement.query';
import { useSchoolAnalyticsQuery } from '@/modules/school-admin/queries/use-school-analytics.query';

// Owns the C-ENT-01 query for the Account page and maps its states the same way
// the school overview does: skeletons while pending, an Alert with retry on
// error, the dumb plan and allowance cards on success. C-RPT-06 runs alongside
// it for the spec's seat pair only — it never gates the allowance card, so a
// failed analytics read leaves the seat tile at the no-value dash and the rest
// of the section intact.
export function AccountEntitlementSection() {
  const t = useTranslations('SchoolAdmin.entitlement');
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const enabled = hydrated && Boolean(token);
  const entitlementQuery = useEntitlementQuery(enabled);
  const analyticsQuery = useSchoolAnalyticsQuery(enabled);

  if (entitlementQuery.isPending || analyticsQuery.isPending) {
    return (
      <section aria-label={t('title')} className="flex flex-col gap-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </section>
    );
  }

  if (entitlementQuery.isError) {
    return (
      <Alert
        variant="error"
        title={t('errorTitle')}
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={entitlementQuery.isFetching}
            onClick={() => entitlementQuery.refetch()}
          >
            {t('retry')}
          </Button>
        }
      >
        {t('errorDescription')}
      </Alert>
    );
  }

  return (
    <>
      <AccountPlanCard entitlement={entitlementQuery.data} analytics={analyticsQuery.data ?? null} />
      <AccountAllowanceCard allowances={entitlementQuery.data.allowances} />
    </>
  );
}
