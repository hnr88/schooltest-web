'use client';

import { CalendarCheck, ClipboardList, GraduationCap, UsersRound } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { MetricCard } from '@/modules/design-system';
import { METRIC_ENTER, STAGGER_DELAYS } from '@/modules/dashboard/constants/dashboard.constants';
import type { DashboardOverview } from '@/modules/dashboard/types/dashboard-overview.types';

// Panel elevation (.qa/CONTRAST-SPEC.md → metricSpec): white KPI cards rest at
// --shadow-md (0 2px 8px .08, the canonical "raised panel" value) and hover to
// --shadow-lg (0 8px 24px .12, the canonical card-hover value). The live audit
// found --shadow-lg and --shadow-xl at ZERO uses across 49 painted surfaces —
// this spends a ramp tokens.css already publishes. Passed as className rather
// than edited into metric-card.tsx so the design-system default stays untouched.
const WHITE_CARD_ELEVATION = 'shadow-md hover:shadow-lg';

export function DashboardMetrics({ overview }: { overview: DashboardOverview }) {
  const format = useFormatter();
  const t = useTranslations('Dashboard');
  const total = format.number(overview.totalStudents);
  const allPlanned = overview.studentsMissingEntryPlan === 0;

  return (
    <section
      data-slot="dashboard-plan-board"
      aria-labelledby="dashboard-plan-board-title"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      <h2 id="dashboard-plan-board-title" className="sr-only">
        {t('metricsHeading')}
      </h2>
      {/* Position 1 is the ONLY navy card in this row, and it is navy because of
          WHAT it is, not where it sits: totalProfiles = linked children = the
          figure this account is measured by, carrying the account's primary action.
          The app's own SidebarPromoPanel already renders that exact count on
          #0E2350. Canonical precedent is App Screens → Billing, card 1 of 3.
          No delta and no progress are passed: green/red deltas do not survive onto
          navy anywhere in the corpus, and the CTA link takes the delta slot. Navy
          is FIRST at every breakpoint (grid-cols-1 / sm:2 / xl:4). */}
      <MetricCard
        className={cn(METRIC_ENTER, STAGGER_DELAYS[0])}
        icon={UsersRound}
        tone="navy"
        label={t('totalProfiles')}
        value={total}
        action={{ href: '/dashboard/children', label: t('viewChildren') }}
      />
      <MetricCard
        className={cn(METRIC_ENTER, STAGGER_DELAYS[1], WHITE_CARD_ELEVATION)}
        icon={CalendarCheck}
        iconTone="teal"
        label={t('entryPlans')}
        value={t('metricFraction', {
          completed: format.number(overview.studentsWithEntryPlan),
          total,
        })}
        delta={t('percentComplete', { percent: overview.entryPlanCompletion })}
        deltaTone={allPlanned ? 'positive' : 'neutral'}
        progress={overview.entryPlanCompletion}
        progressLabel={t('entryPlans')}
      />
      <MetricCard
        className={cn(METRIC_ENTER, STAGGER_DELAYS[2], WHITE_CARD_ELEVATION)}
        icon={ClipboardList}
        iconTone={allPlanned ? 'teal' : 'amber'}
        label={t('profilesNeedingPlan')}
        value={format.number(overview.studentsMissingEntryPlan)}
        delta={allPlanned ? t('allProfilesPlanned') : t('needsAttention')}
        deltaTone={allPlanned ? 'positive' : 'negative'}
      />
      <MetricCard
        className={cn(METRIC_ENTER, STAGGER_DELAYS[3], WHITE_CARD_ELEVATION)}
        icon={GraduationCap}
        iconTone="teal"
        label={t('enrolledStudents')}
        value={format.number(overview.enrolledStudents)}
        delta={t('ofTotalProfiles', {
          count: format.number(overview.enrolledStudents),
          total,
        })}
        deltaTone="neutral"
      />
    </section>
  );
}
