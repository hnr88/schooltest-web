'use client';

import { useTranslations } from 'next-intl';

import { useAuthStore } from '@/modules/auth';
import { Alert, Button, Skeleton } from '@/modules/design-system';
import { AccountAllowanceCard } from '@/modules/school-admin/components/AccountAllowanceCard';
import { AccountPlanCard } from '@/modules/school-admin/components/AccountPlanCard';
import { useEntitlementQuery } from '@/modules/school-admin/queries/use-entitlement.query';

// Owns the C-ENT-01 query for the Account page and maps its states the same way
// the school overview does: skeletons while pending, an Alert with retry on
// error, the dumb plan and allowance cards on success.
export function AccountEntitlementSection() {
  const t = useTranslations('SchoolAdmin.entitlement');
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const entitlementQuery = useEntitlementQuery(hydrated && Boolean(token));

  if (entitlementQuery.isPending) {
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
      <AccountPlanCard entitlement={entitlementQuery.data} />
      <AccountAllowanceCard allowances={entitlementQuery.data.allowances} />
    </>
  );
}
