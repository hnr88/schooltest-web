'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { getStudentDisplayName, getStudentInitials } from '@/lib/student-name';
import { getProfileCompletion } from '@/modules/dashboard/lib/dashboard-overview';
import type { DashboardOverview } from '@/modules/dashboard/types/dashboard-overview.types';

// The right cell of the portal hero grid (spec 01 §4.4): white card at radius 24,
// a baseline-aligned title + range row, a 120px plot of 30px-wide 8px-radius
// columns over their labels, and a caption naming the notable column.
//
// WHAT THE COLUMNS MAY MEASURE. The design plots practice minutes per day. There
// is no practice-session read in the parent contract — it arrives with
// C-DASH-HOUSEHOLD — so no bar here is a minute count. The columns plot the one
// per-child measurement this account really holds: profile readiness, the share
// of the six planning fields filled in. The design's "highlight the notable
// column" rule is kept and pointed at the LOWEST bar, which is the one a parent
// can act on.
export function DashboardReadinessPanel({ overview }: { overview: DashboardOverview }) {
  const t = useTranslations('Dashboard');
  const bars = overview.recentStudents.map((student) => ({
    documentId: student.documentId,
    name: getStudentDisplayName(student, t('unknownProfile')),
    initials: getStudentInitials(student),
    percent: getProfileCompletion(student),
  }));
  const lowest = bars.reduce<(typeof bars)[number] | null>(
    (worst, bar) => (worst === null || bar.percent < worst.percent ? bar : worst),
    null,
  );

  return (
    <section
      data-slot="dashboard-readiness-chart"
      aria-labelledby="dashboard-readiness-chart-title"
      className="flex flex-col rounded-card bg-card p-6 shadow-sm sm:px-7.5 sm:py-7"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2
          id="dashboard-readiness-chart-title"
          className="text-body-lg font-semibold text-foreground"
        >
          {t('readinessChartTitle')}
        </h2>
        <span className="shrink-0 text-meta text-body">
          {t('readinessChartRange', { count: bars.length })}
        </span>
      </div>

      {lowest === null ? (
        <p className="mt-5 flex min-h-30 flex-1 items-center text-body-sm text-body">
          {t('readinessChartEmpty')}
        </p>
      ) : (
        <>
          <ul className="mt-5 flex min-h-30 flex-1 items-stretch gap-3.5">
            {bars.map((bar, index) => (
              <li key={bar.documentId} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <span className="sr-only">
                  {bar.name}: {t('percentValue', { percent: bar.percent })}
                </span>
                {/* The plot area must be a definite-height box of its own: a
                    percentage height inside an items-end list resolves against an
                    auto-height column and collapses to nothing. */}
                <span
                  aria-hidden="true"
                  className="flex min-h-0 w-full flex-1 items-end justify-center"
                >
                  <span
                    style={{
                      height: `${Math.max(6, bar.percent)}%`,
                      animationDelay: `${index * 70}ms`,
                    }}
                    className={cn(
                      'block w-full max-w-7.5 rounded-md bar-grow',
                      bar.documentId === lowest.documentId ? 'bg-navy-900' : 'bg-border',
                    )}
                  />
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    'w-full truncate text-center text-micro',
                    bar.documentId === lowest.documentId
                      ? 'font-semibold text-foreground'
                      : 'text-body',
                  )}
                >
                  {bar.initials}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-body-sm text-body">
            {t.rich(lowest.percent === 100 ? 'readinessChartAllDone' : 'readinessChartCaption', {
              name: lowest.name,
              percent: t('percentValue', { percent: lowest.percent }),
              strong: (chunks) => <strong className="font-semibold text-foreground">{chunks}</strong>,
            })}
          </p>
        </>
      )}
    </section>
  );
}
