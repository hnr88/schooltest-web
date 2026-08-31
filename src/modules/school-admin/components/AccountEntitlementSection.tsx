'use client';

import { useTranslations } from 'next-intl';

import { useAuthStore } from '@/modules/auth';
import { Alert, Button, Skeleton } from '@/modules/design-system';
import { AccountAllowanceCard } from '@/modules/school-admin/components/AccountAllowanceCard';
import { AccountPlanCard } from '@/modules/school-admin/components/AccountPlanCard';
import { useEntitlementQuery } from '@/modules/school-admin/queries/use-entitlement.query';

// Owns the C-ENT-01 query for the Account view's "Plan" tab and maps its
// states the same way the school overview does: skeletons while pending, an
// Alert with retry on error, the dumb plan and allowance cards on success.
// Every figure the tab renders — plan, seats used/total, renewal, each
// allowance — comes from this one payload; no second query feeds the card.
// The artboard's "no-seats alert" is driven by the same payload's
// seats_remaining === 0 — real data only, no client-side estimate.
export function AccountEntitlementSection() {
  const t = useTranslations('SchoolAdmin.entitlement');
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const enabled = hydrated && Boolean(token);
  const entitlementQuery = useEntitlementQuery(enabled);

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
      {entitlementQuery.data.seats_remaining === 0 && (
        <Alert variant="warning" title={t('seatCapTitle')}>
          {t('seatCapReached')}
        </Alert>
      )}
      <AccountAllowanceCard allowances={entitlementQuery.data.allowances} />
    </>
  );
}
