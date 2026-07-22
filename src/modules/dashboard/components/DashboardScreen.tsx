'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { useAuth } from '@/modules/auth';
import { DashboardChildrenPanel } from '@/modules/dashboard/components/DashboardChildrenPanel';
import { DashboardFocusCard } from '@/modules/dashboard/components/DashboardFocusCard';
import { DashboardGreeting } from '@/modules/dashboard/components/DashboardGreeting';
import { DashboardHeroPanel } from '@/modules/dashboard/components/DashboardHeroPanel';
import { DashboardPromo } from '@/modules/dashboard/components/DashboardPromo';
import { DashboardReadinessPanel } from '@/modules/dashboard/components/DashboardReadinessPanel';
import { DashboardRecentActivity } from '@/modules/dashboard/components/DashboardRecentActivity';
import { DashboardRecommended } from '@/modules/dashboard/components/DashboardRecommended';
import { DashboardSkeleton } from '@/modules/dashboard/components/DashboardSkeleton';
import { METRIC_ENTER, STAGGER_DELAYS } from '@/modules/dashboard/constants/dashboard.constants';
import { getDashboardOverview } from '@/modules/dashboard/lib/dashboard-overview';
import { useDashboardOverviewStudentsQuery } from '@/modules/dashboard/queries/use-students.query';
import { Alert, Button } from '@/modules/design-system';

// The portal dashboard column (spec 01 §1.3): one flex column at a 28px gap
// holding, top to bottom — the greeting row (§2), the 2-up hero grid whose left
// cell is the navy summary panel (§3) and whose right cell is the chart card
// (§4.4), the "My children" list card (§5), the note + recommendations grid (§6),
// and the dated list that closes the page (§7).
//
// The design's two 2-up grids are `repeat(auto-fit, minmax(380px, 1fr))`. Inside
// this app the column is already narrowed by a 248px rail, so the same collapse
// point is expressed as `lg:grid-cols-2` — one column below 1024, two above,
// which is where 2 × 380 + 20 + rail + padding actually stops fitting.
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
      className="flex flex-1 flex-col gap-7 px-4 py-6 sm:px-6 lg:px-8"
    >
      <DashboardGreeting name={user.username} />
      <div className={cn('grid items-stretch gap-5 lg:grid-cols-2', METRIC_ENTER)}>
        <DashboardHeroPanel overview={overview} />
        <DashboardReadinessPanel overview={overview} />
      </div>
      <div className={cn(METRIC_ENTER, STAGGER_DELAYS[1])}>
        <DashboardChildrenPanel overview={overview} />
      </div>
      <div
        className={cn('grid items-stretch gap-5 lg:grid-cols-2', METRIC_ENTER, STAGGER_DELAYS[2])}
      >
        <DashboardFocusCard overview={overview} />
        <DashboardRecommended overview={overview} />
      </div>
      <div
        className={cn(
          'grid items-start gap-5 xl:grid-cols-overview-split',
          METRIC_ENTER,
          STAGGER_DELAYS[3],
        )}
      >
        <DashboardRecentActivity overview={overview} />
        <DashboardPromo />
      </div>
    </main>
  );
}
