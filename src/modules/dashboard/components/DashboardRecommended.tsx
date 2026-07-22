'use client';

import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { getStudentDisplayName } from '@/lib/student-name';
import { RECOMMENDATION_COPY_KEYS } from '@/modules/dashboard/constants/dashboard.constants';
import { getProfileCompletion } from '@/modules/dashboard/lib/dashboard-overview';
import { getDashboardRecommendations } from '@/modules/dashboard/lib/dashboard-recommendations';
import type { DashboardOverview } from '@/modules/dashboard/types/dashboard-overview.types';

// "Recommended this week" (spec 01 §6.2): white card at radius 24, a 16px/600
// title, then rows of a 26px outlined index disc · title + meta · a trailing
// action. Rows are derived, never authored — see lib/dashboard-recommendations.ts.
export function DashboardRecommended({ overview }: { overview: DashboardOverview }) {
  const t = useTranslations('Dashboard');
  const rows = getDashboardRecommendations(overview);

  return (
    <section
      data-slot="dashboard-recommended"
      aria-labelledby="dashboard-recommended-title"
      className="flex flex-col rounded-card bg-card p-6 shadow-sm sm:px-7.5 sm:py-7"
    >
      <h2 id="dashboard-recommended-title" className="text-body-lg font-semibold text-foreground">
        {t('recommendedTitle')}
      </h2>
      <ul className="mt-3.5 flex flex-col gap-1.5">
        {rows.map((row, index) => {
          const keys = RECOMMENDATION_COPY_KEYS[row.kind];
          const name =
            row.student === null ? '' : getStudentDisplayName(row.student, t('unknownProfile'));
          const percent = row.student === null ? 0 : getProfileCompletion(row.student);
          const title = t(keys.title, { name });
          const action = t(keys.action);

          return (
            <li key={row.id} className="flex items-center gap-3.5 py-1">
              <span
                aria-hidden="true"
                className="grid size-6.5 flex-none place-items-center rounded-full border border-portal-input text-micro font-bold text-body"
              >
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-body-md font-semibold text-foreground">{title}</p>
                <p className="mt-0.25 text-meta text-body">{t(keys.meta, { name, percent })}</p>
              </div>
              {/* Three rows would otherwise ship three links all named "Open".
                  The label keeps the visible word first (WCAG 2.5.3) and adds the
                  row it belongs to. */}
              <Link
                href={row.href}
                aria-label={t('recommendActionLabel', { action, title })}
                className="inline-flex min-h-11 flex-none items-center rounded-lg px-2.5 text-body-sm font-semibold text-primary transition-colors duration-200 ease-out-expo hover:bg-blue-50 hover:text-blue-700 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none"
              >
                {action}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
