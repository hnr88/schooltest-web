'use client';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useAuth } from '@/modules/auth';
import { DashboardExploreOptions } from '@/modules/dashboard/components/DashboardExploreOptions';
import { DashboardHero } from '@/modules/dashboard/components/DashboardHero';
import { DashboardMetrics } from '@/modules/dashboard/components/DashboardMetrics';
import { DashboardRecentProfiles } from '@/modules/dashboard/components/DashboardRecentProfiles';
import { getDashboardOverview } from '@/modules/dashboard/lib/dashboard-overview';
import { useDashboardOverviewStudentsQuery } from '@/modules/dashboard/queries/use-students.query';
import { Alert, Button, Skeleton } from '@/modules/design-system';

export function DashboardScreen() {
  const t = useTranslations('Dashboard');
  const { user, isLoading } = useAuth();
  const studentsQuery = useDashboardOverviewStudentsQuery();

  if (isLoading || !user || studentsQuery.isPending) {
    return (
      <main className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <p className="sr-only" role="status">
          {t('loading')}
        </p>
        <div aria-hidden="true" className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-56 w-full" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        </div>
      </main>
    );
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
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-h3 font-bold text-foreground">
            {t('welcomeTitle', { name: user.username })}
          </h1>
          <p className="text-sm text-muted-foreground">{t('welcomeSubtitle')}</p>
        </div>
        <Button href="/dashboard/children/new">
          <Plus aria-hidden="true" className="size-4" />
          {t('addStudent')}
        </Button>
      </header>

      <DashboardHero overview={overview} />
      <DashboardMetrics overview={overview} />
      <div className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <DashboardRecentProfiles overview={overview} />
        </div>
        <div className="xl:col-span-4">
          <DashboardExploreOptions />
        </div>
      </div>
    </main>
  );
}
