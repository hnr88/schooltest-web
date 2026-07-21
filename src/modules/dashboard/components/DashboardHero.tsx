'use client';

import { ArrowRight, Compass, UsersRound } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Eyebrow,
} from '@/modules/design-system';
import type { DashboardOverview } from '@/modules/dashboard/types/dashboard-overview.types';

export function DashboardHero({ overview }: { overview: DashboardOverview }) {
  const format = useFormatter();
  const t = useTranslations('Dashboard');

  return (
    <section data-slot="dashboard-family-summary" aria-labelledby="dashboard-family-summary-title">
      <Card className="rounded-2xl border-navy-900 bg-navy-950 py-6 text-white shadow-lg">
        <CardHeader className="gap-3 px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Eyebrow tone="teal" className="text-teal-100">
              {t('overviewEyebrow')}
            </Eyebrow>
            <Badge className="border-white/20 bg-white/10 text-white">
              {t('profileCount', { count: overview.totalStudents })}
            </Badge>
          </div>
          <CardTitle
            id="dashboard-family-summary-title"
            role="heading"
            aria-level={2}
            className="max-w-2xl text-h3 font-bold text-white"
          >
            {t('familySummaryTitle')}
          </CardTitle>
          <CardDescription className="max-w-2xl text-blue-100">
            {t('familySummaryDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5 px-6">
          <dl className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-white/10 p-4">
              <dt className="flex items-center gap-2 text-sm text-blue-100">
                <UsersRound aria-hidden="true" className="size-4 text-teal-300" />
                {t('totalProfiles')}
              </dt>
              <dd className="mt-2 text-2xl font-bold">{format.number(overview.totalStudents)}</dd>
            </div>
            <div className="rounded-xl bg-white/10 p-4">
              <dt className="text-sm text-blue-100">{t('activeProfiles')}</dt>
              <dd className="mt-2 text-2xl font-bold">{format.number(overview.activeStudents)}</dd>
            </div>
            <div className="rounded-xl bg-white/10 p-4">
              <dt className="text-sm text-blue-100">{t('entryPlans')}</dt>
              <dd className="mt-2 text-2xl font-bold">
                {t('metricFraction', {
                  completed: format.number(overview.studentsWithEntryPlan),
                  total: format.number(overview.totalStudents),
                })}
              </dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-3">
            <Button href="/dashboard/children" variant="outline-white" size="lg">
              {t('viewChildren')}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Button>
            <Button href="/dashboard/search?mode=schools" variant="white" size="lg">
              <Compass aria-hidden="true" className="size-4" />
              {t('exploreSchools')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
