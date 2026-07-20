'use client';

import { ClipboardCheck, GraduationCap, UserCheck, Users } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { StatCard } from '@/modules/design-system';
import type { DashboardOverview } from '@/modules/dashboard/types/dashboard-overview.types';

export function DashboardMetrics({ overview }: { overview: DashboardOverview }) {
  const format = useFormatter();
  const t = useTranslations('Dashboard');
  const total = format.number(overview.totalStudents);

  return (
    <section data-slot="dashboard-metrics" aria-labelledby="dashboard-metrics-title">
      <h2 id="dashboard-metrics-title" className="sr-only">
        {t('metricsHeading')}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Users}
          iconTone="blue"
          label={t('totalProfiles')}
          value={total}
          delta={t('totalProfilesDetail')}
          className="border-l-4 border-blue-100 border-l-blue-600 bg-card dark:border-blue-950"
        />
        <StatCard
          icon={UserCheck}
          iconTone="teal"
          label={t('activeProfiles')}
          value={format.number(overview.activeStudents)}
          delta={t('ofTotalProfiles', {
            count: format.number(overview.activeStudents),
            total,
          })}
          className="border-l-4 border-teal-100 border-l-teal-600 bg-card dark:border-teal-950"
        />
        <StatCard
          icon={GraduationCap}
          iconTone="navy"
          label={t('enrolledStudents')}
          value={format.number(overview.enrolledStudents)}
          delta={t('ofTotalProfiles', {
            count: format.number(overview.enrolledStudents),
            total,
          })}
          className="border-l-4 border-navy-800 border-l-navy-900 bg-card dark:border-navy-800"
        />
        <StatCard
          icon={ClipboardCheck}
          iconTone="teal"
          label={t('entryPlans')}
          value={t('metricFraction', {
            completed: format.number(overview.studentsWithEntryPlan),
            total,
          })}
          delta={t('entryPlansDetail')}
          progress={overview.entryPlanCompletion}
          className="border-l-4 border-teal-100 border-l-teal-600 bg-card dark:border-teal-950"
        />
      </div>
    </section>
  );
}
