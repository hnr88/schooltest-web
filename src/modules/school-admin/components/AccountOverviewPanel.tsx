'use client';

import { useTranslations } from 'next-intl';

import { useAuth, useAuthStore } from '@/modules/auth';
import { Alert, Button, Skeleton } from '@/modules/design-system';
import { AccountDetailsCard } from '@/modules/school-admin/components/AccountDetailsCard';
import { AccountEntitlementSection } from '@/modules/school-admin/components/AccountEntitlementSection';
import { useMySchoolQuery } from '@/modules/school-admin/queries/use-my-school.query';

// The "My account" sub-tab (spec section 5). Owns the C-SCH-01 read for the
// school details card; the plan, seats and allowance cards below own their own
// C-ENT-01 read. The admin email is the signed-in user's own, from the auth
// module — the school record carries no admin contact.
export function AccountOverviewPanel() {
  const t = useTranslations('SchoolAdmin.home');
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const schoolQuery = useMySchoolQuery(hydrated && Boolean(token));
  const { user } = useAuth();

  if (schoolQuery.isPending) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (schoolQuery.isError) {
    return (
      <Alert
        variant="error"
        title={t('errorTitle')}
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={schoolQuery.isFetching}
            onClick={() => schoolQuery.refetch()}
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
      <AccountDetailsCard school={schoolQuery.data} adminEmail={user?.email ?? null} />
      <AccountEntitlementSection />
    </>
  );
}
