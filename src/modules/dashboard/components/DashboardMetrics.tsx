'use client';

import { ClipboardCheck, GraduationCap } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ProgressBar,
} from '@/modules/design-system';
import type { DashboardOverview } from '@/modules/dashboard/types/dashboard-overview.types';

export function DashboardMetrics({ overview }: { overview: DashboardOverview }) {
  const format = useFormatter();
  const t = useTranslations('Dashboard');
  const total = format.number(overview.totalStudents);

  return (
    <section data-slot="dashboard-plan-board" aria-labelledby="dashboard-plan-board-title">
      <Card className="rounded-2xl border-border shadow-sm">
        <CardHeader>
          <CardTitle id="dashboard-plan-board-title" role="heading" aria-level={2}>
            {t('planningTitle')}
          </CardTitle>
          <CardDescription>{t('planningDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-3">
          <div className="self-start rounded-xl bg-muted p-4 lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{t('entryPlans')}</p>
                <p className="mt-1 text-sm text-secondary-foreground">{t('entryPlansDetail')}</p>
              </div>
              <span className="text-2xl font-bold text-foreground">
                {t('metricFraction', {
                  completed: format.number(overview.studentsWithEntryPlan),
                  total,
                })}
              </span>
            </div>
            <ProgressBar
              value={overview.entryPlanCompletion}
              tone="solid"
              ariaLabel={t('entryPlans')}
              className="mt-4"
            />
          </div>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-xl border border-border p-4">
              <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                <ClipboardCheck aria-hidden="true" className="size-4 text-primary" />
                {t('profilesNeedingPlan')}
              </dt>
              <dd className="mt-2 text-2xl font-bold text-foreground">
                {format.number(overview.studentsMissingEntryPlan)}
              </dd>
            </div>
            <div className="rounded-xl border border-border p-4">
              <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                <GraduationCap aria-hidden="true" className="size-4 text-teal-600" />
                {t('enrolledStudents')}
              </dt>
              <dd className="mt-2 text-2xl font-bold text-foreground">
                {format.number(overview.enrolledStudents)}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </section>
  );
}
