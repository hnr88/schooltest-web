'use client';

import { ArrowRight } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { getStudentDisplayName } from '@/lib/student-name';
import { STAGGER_DELAYS } from '@/modules/dashboard/constants/dashboard.constants';
import type { DashboardOverview } from '@/modules/dashboard/types/dashboard-overview.types';

// The dated list that closes the portal dashboard (spec 01 §7): a card at radius
// 24 with only 8px of its own vertical padding, a 19px head row with a trailing
// link, then rows of a 56px date block · a 34px vertical rule · a text stack · a
// trailing status, hairline-separated, the last row dropping its rule.
//
// The design fills those rows with scheduled sittings. B-1/B-2: NOTHING in any
// content-type carries a scheduled_at, due_at or assignment — there is no count to
// show and no row to draw, so the section is NOT the design's "Coming up". It is
// the real ledger the students read supports: every row is one timestamp
// GET /api/my/students returned, and a row is "updated" only when updatedAt is
// genuinely later than createdAt.
export function DashboardRecentActivity({ overview }: { overview: DashboardOverview }) {
  const format = useFormatter();
  const t = useTranslations('Dashboard');
  const entries = overview.recentActivity;

  return (
    <section
      data-slot="dashboard-activity-feed"
      aria-labelledby="dashboard-activity-feed-title"
      className="rounded-card bg-card px-4 py-2 shadow-sm sm:px-7.5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 pt-4.5 pb-1.5">
        <h2 id="dashboard-activity-feed-title" className="text-h4 font-semibold text-foreground">
          {t('activityTitle')}
        </h2>
        <Link
          href="/dashboard/children"
          className="group inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2.5 text-body-sm font-medium text-body transition-colors duration-200 ease-out-expo hover:bg-blue-50 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none"
        >
          {t('allProfiles')}
          <ArrowRight
            aria-hidden="true"
            className="size-3.5 transition-transform duration-200 ease-out-expo group-hover:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none"
          />
        </Link>
      </div>

      {entries.length === 0 ? (
        <p className="pt-1 pb-5 text-body-sm text-body">{t('activityEmpty')}</p>
      ) : (
        <ul>
          {entries.map((entry, index) => {
            const at = new Date(entry.at);
            const added = entry.kind === 'added';

            return (
              <li
                key={entry.documentId}
                className={cn(
                  'flex animate-in items-center gap-4 py-4.5 duration-300 fill-mode-backwards ease-out-expo slide-in-from-bottom-2 motion-reduce:animate-none sm:gap-5',
                  STAGGER_DELAYS[index] ?? 'delay-200',
                  index === entries.length - 1 ? 'pb-6' : 'border-b border-divider',
                )}
              >
                <span className="flex w-14 flex-none flex-col items-center">
                  <span className="text-stat-sm leading-none font-bold text-foreground tabular-nums">
                    {format.dateTime(at, { day: '2-digit' })}
                  </span>
                  <span className="mt-0.75 text-micro font-semibold tracking-rail text-body uppercase">
                    {format.dateTime(at, { month: 'short' })}
                  </span>
                </span>
                <span aria-hidden="true" className="h-8.5 w-px flex-none bg-divider" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body-md font-semibold text-foreground">
                    {getStudentDisplayName(entry.student, t('unknownProfile'))}
                  </span>
                  <span className="mt-0.5 block truncate text-body-sm text-body">
                    {t(added ? 'activityAddedDetail' : 'activityUpdatedDetail')}
                  </span>
                </span>
                <span
                  className={cn(
                    'flex-none text-meta tabular-nums',
                    added ? 'font-semibold text-primary' : 'font-medium text-body',
                  )}
                >
                  {format.dateTime(at, { hour: 'numeric', minute: '2-digit' })}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
