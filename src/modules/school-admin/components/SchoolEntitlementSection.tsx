'use client';

import { useTranslations } from 'next-intl';

import { useAuthStore } from '@/modules/auth';
import { Alert, Button, Skeleton } from '@/modules/design-system';
import { SchoolEntitlementPanel } from '@/modules/school-admin/components/SchoolEntitlementPanel';
import { useEntitlementQuery } from '@/modules/school-admin/queries/use-entitlement.query';

// Owns the C-ENT-01 query for the school overview and maps its states:
// skeletons while pending, an Alert with retry on error, the dumb panel on
// success. 401/403 are handled by the axios interceptor and the route guard.
export function SchoolEntitlementSection() {
  const t = useTranslations('SchoolAdmin.entitlement');
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const entitlementQuery = useEntitlementQuery(hydrated && Boolean(token));

  if (entitlementQuery.isPending) {
    return (
      <section aria-label={t('title')} className="flex flex-col gap-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-24 w-full" />
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

  return <SchoolEntitlementPanel entitlement={entitlementQuery.data} />;
}
