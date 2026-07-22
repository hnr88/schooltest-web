'use client';

import { ArrowRight, Plus, UsersRound } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { Badge, Button, EmptyState } from '@/modules/design-system';
import { DashboardChildSummaryCard } from '@/modules/dashboard/components/DashboardChildSummaryCard';
import { METRIC_ENTER, STAGGER_DELAYS } from '@/modules/dashboard/constants/dashboard.constants';
import type { DashboardOverview } from '@/modules/dashboard/types/dashboard-overview.types';

export function DashboardFamilySummary({ overview }: { overview: DashboardOverview }) {
  const t = useTranslations('Dashboard');

  return (
    <section
      data-slot="dashboard-family-summary"
      aria-labelledby="dashboard-family-summary-title"
      className="flex flex-col gap-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2
            id="dashboard-family-summary-title"
            className="text-panel-title font-semibold text-foreground"
          >
            {t('familySummaryTitle')}
          </h2>
          {/* These chips sit DIRECTLY on the well. bg-muted (#F1F5F9) against
              #EEF2F7 is 1.03:1 — invisible. They step UP to the chrome white the
              panels use, with the canonical #E3E8F0 hairline giving them an edge
              (1.12:1 surface, 1.08:1 edge) and --color-body ink at 8.02:1. */}
          <Badge variant="outline" className="border-border bg-card text-body">
            {t('summaryProfilesChip', { count: overview.totalStudents })}
          </Badge>
          <Badge variant="outline" className="border-border bg-card text-body">
            {t('summaryActiveChip', { count: overview.activeStudents })}
          </Badge>
          <Badge variant="outline" className="border-transparent bg-blue-50 text-primary">
            {t('summaryPlansChip', {
              completed: overview.studentsWithEntryPlan,
              total: overview.totalStudents,
            })}
          </Badge>
        </div>
        <Link
          href="/dashboard/children"
          className="group inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2.5 text-body-sm font-semibold text-primary transition-colors duration-200 ease-out-expo hover:bg-blue-50 hover:text-blue-700 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none"
        >
          {t('viewChildren')}
          <ArrowRight
            aria-hidden="true"
            className="size-3.5 transition-transform duration-200 ease-out-expo group-hover:translate-x-0.5 motion-reduce:transition-none"
          />
        </Link>
      </div>

      {overview.featuredStudents.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title={t('recentProfilesEmptyTitle')}
          description={t('recentProfilesEmptySubtitle')}
          action={
            <Button href="/dashboard/children/new" size="sm">
              <Plus aria-hidden="true" className="size-4" />
              {t('addFirstStudent')}
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {overview.featuredStudents.map((student, index) => (
            <div
              key={student.documentId}
              className={cn(METRIC_ENTER, STAGGER_DELAYS[index] ?? 'delay-200')}
            >
              <DashboardChildSummaryCard student={student} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
