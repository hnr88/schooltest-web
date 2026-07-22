'use client';

import { useTranslations } from 'next-intl';

import { useAuth } from '@/modules/auth';
import { DashboardExploreOptions } from '@/modules/dashboard/components/DashboardExploreOptions';
import { DashboardFamilySummary } from '@/modules/dashboard/components/DashboardFamilySummary';
import { DashboardGreeting } from '@/modules/dashboard/components/DashboardGreeting';
import { DashboardMetrics } from '@/modules/dashboard/components/DashboardMetrics';
import { DashboardReadinessCard } from '@/modules/dashboard/components/DashboardReadinessCard';
import { DashboardRecentProfiles } from '@/modules/dashboard/components/DashboardRecentProfiles';
import { DashboardSkeleton } from '@/modules/dashboard/components/DashboardSkeleton';
import { getDashboardOverview } from '@/modules/dashboard/lib/dashboard-overview';
import { useDashboardOverviewStudentsQuery } from '@/modules/dashboard/queries/use-students.query';
import { Alert, Button } from '@/modules/design-system';

export function DashboardScreen() {
  const t = useTranslations('Dashboard');
  const { user, isLoading } = useAuth();
  const studentsQuery = useDashboardOverviewStudentsQuery();

  if (isLoading || !user || studentsQuery.isPending) {
    return <DashboardSkeleton />;
  }

  if (studentsQuery.isError) {
    return (
      <main className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Alert
          variant="error"
          title={t('studentsError')}
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={studentsQuery.isFetching}
              onClick={() => studentsQuery.refetch()}
            >
              {t('retry')}
            </Button>
          }
        >
          {t('studentsErrorDescription')}
        </Alert>
      </main>
    );
  }

  const overview = getDashboardOverview(studentsQuery.data ?? []);

  return (
    <main
      data-slot="dashboard-overview"
      data-surface="parent-overview"
      className="flex flex-1 animate-in flex-col gap-6 px-4 py-6 duration-300 ease-out-expo slide-in-from-bottom-2 motion-reduce:animate-none sm:px-6 lg:px-8"
    >
      <DashboardGreeting name={user.username} />
      <DashboardFamilySummary overview={overview} />
      <DashboardMetrics overview={overview} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <DashboardRecentProfiles overview={overview} />
        </div>
        <div className="xl:col-span-4">
          <DashboardReadinessCard overview={overview} />
        </div>
      </div>
      <DashboardExploreOptions />
    </main>
  );
}
