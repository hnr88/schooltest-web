'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { getPlanBoardStats } from '@/modules/dashboard/lib/dashboard-overview';
import type { DashboardOverview } from '@/modules/dashboard/types/dashboard-overview.types';

// Portal navy summary panel (spec 01 §3): #0E2350 at radius 24, 32/34 padding,
// two bled white discs, an uppercase eyebrow, a 24px/500 sentence whose emphasis
// carries a 2px teal underline, and the stat row pinned to the bottom by
// `margin-top:auto` behind 1px vertical rules.
//
// WHAT THE SENTENCE MAY SAY. The design's copy ("Emma is on track for B2 …") is
// BLOCKED B-10: a forward CEFR projection and a percent delta, neither of which has
// a field. The sentence is re-pointed at the one family-level fact
// GET /api/my/students does support — how many children still need a target entry
// year and term — so the slot keeps its shape and claims nothing.
export function DashboardHeroPanel({ overview }: { overview: DashboardOverview }) {
  const format = useFormatter();
  const t = useTranslations('Dashboard');
  const { totalStudents, studentsMissingEntryPlan } = overview;
  const headlineKey =
    totalStudents === 0
      ? 'heroHeadlineEmpty'
      : studentsMissingEntryPlan === 0
        ? 'heroHeadlinePlanned'
        : 'heroHeadlineNeedsPlan';

  // The design's hero carries exactly THREE stat cells. getPlanBoardStats opens
  // with the bare profile total, which the "Your children" chips 200px below
  // already print — dropping it here is what lands the row on the design's three
  // cells instead of a wrapped four.
  const stats = getPlanBoardStats(overview, {
    format: (value) => format.number(value),
    fraction: (completed, total) => t('metricFraction', { completed, total }),
    totalProfiles: t('totalProfiles'),
    entryPlans: t('entryPlans'),
    needingPlan: t('needingPlanShort'),
    enrolled: t('enrolledStudents'),
  }).slice(1);

  return (
    <section
      data-slot="dashboard-hero"
      className="relative flex flex-col overflow-hidden rounded-card bg-navy-900 p-6 sm:px-8.5 sm:py-8"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-22.5 -right-17.5 size-70 rounded-full bg-surface-glass"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-15 -bottom-27.5 size-50 rounded-full bg-surface-glass-soft"
      />
      <p className="relative text-meta font-semibold tracking-overline text-navy-muted uppercase">
        {t('heroEyebrow')}
      </p>
      <p className="relative mt-3.5 max-w-105 text-h3 font-medium text-primary-foreground">
        {t.rich(headlineKey, {
          missing: format.number(studentsMissingEntryPlan),
          total: format.number(totalStudents),
          mark: (chunks) => (
            <span className="border-b-2 border-accent-on-dark font-bold">{chunks}</span>
          ),
        })}
      </p>
      <dl
        data-slot="dashboard-plan-board"
        aria-label={t('metricsHeading')}
        className="relative mt-auto flex flex-wrap gap-x-6 gap-y-4 pt-7"
      >
        {/* The design's separators are their own flex items. They ship as a left
            border on the cell instead so the <dl> keeps the one child shape axe's
            definition-list rule accepts: dl → div → dd + dt, nothing else. */}
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={cn(
              'flex min-w-0 flex-none flex-col gap-0.75',
              index > 0 ? 'sm:border-l sm:border-divider-on-dark sm:pl-6' : null,
            )}
          >
            <dd className="order-1 text-h3 font-bold text-primary-foreground tabular-nums">
              {stat.value}
            </dd>
            <dt className="order-2 text-meta text-navy-muted">{stat.label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}
