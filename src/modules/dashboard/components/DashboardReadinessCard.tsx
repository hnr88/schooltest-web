'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { GaugeRing, MiniStatTile } from '@/modules/design-system';
import {
  INSET_TILE,
  INSET_TILE_NEGATIVE,
  PANEL_ELEVATION,
} from '@/modules/dashboard/constants/dashboard.constants';
import type { DashboardOverview } from '@/modules/dashboard/types/dashboard-overview.types';
import { cn } from '@/lib/utils';

export function DashboardReadinessCard({ overview }: { overview: DashboardOverview }) {
  const format = useFormatter();
  const t = useTranslations('Dashboard');
  const percent = overview.profileCompletionAverage;

  return (
    <section
      data-slot="dashboard-readiness"
      aria-labelledby="dashboard-readiness-title"
      className={cn(
        'flex h-full flex-col items-center justify-center gap-4 rounded-panel border border-border bg-card p-5.5 text-center',
        PANEL_ELEVATION,
      )}
    >
      <div className="flex flex-col items-center gap-1">
        <h2 id="dashboard-readiness-title" className="text-panel-title font-semibold text-foreground">
          {t('profileReadinessTitle')}
        </h2>
        <p className="text-meta text-muted-foreground">{t('profileReadinessDescription')}</p>
      </div>
      <GaugeRing
        value={percent}
        display={t('percentValue', { percent })}
        caption={t('summaryProfilesChip', { count: overview.totalStudents })}
        ariaLabel={t('readinessGaugeLabel', { percent })}
      />
      <div className="grid w-full grid-cols-2 gap-3 text-left">
        <MiniStatTile
          className={INSET_TILE}
          value={t('metricFraction', {
            completed: format.number(overview.studentsWithEntryPlan),
            total: format.number(overview.totalStudents),
          })}
          label={t('entryPlans')}
        />
        <MiniStatTile
          className={overview.studentsMissingEntryPlan > 0 ? INSET_TILE_NEGATIVE : INSET_TILE}
          value={format.number(overview.studentsMissingEntryPlan)}
          label={t('needingPlanShort')}
          tone={overview.studentsMissingEntryPlan > 0 ? 'negative' : 'positive'}
        />
      </div>
    </section>
  );
}
