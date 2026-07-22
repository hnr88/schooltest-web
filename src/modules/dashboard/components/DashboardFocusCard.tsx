'use client';

import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { getStudentDisplayName, getStudentInitials } from '@/lib/student-name';
import { AvatarTint, getAvatarTone } from '@/modules/design-system';
import {
  getDashboardYearLabel,
  getProfileCompletion,
  getReadinessFields,
} from '@/modules/dashboard/lib/dashboard-overview';
import type { DashboardOverview } from '@/modules/dashboard/types/dashboard-overview.types';

// The teacher-note card (spec 01 §6.1): uppercase eyebrow, a 16.5px/1.6 statement
// taking the card's free height, then a footer behind a hairline carrying an
// avatar, a name, a role line and a trailing action.
//
// WHAT THE STATEMENT MAY SAY. The design quotes a named teacher. There is no
// teacher-note, message or comment record a parent can read — the only messages
// the API holds are the notification feed, which is another module's surface. So
// the slot carries the one per-child statement this screen can make truthfully:
// which child is furthest from a complete profile, and by how much.
export function DashboardFocusCard({ overview }: { overview: DashboardOverview }) {
  const t = useTranslations('Dashboard');
  const focus = overview.recentStudents.reduce<{ student: (typeof overview.recentStudents)[number]; percent: number } | null>(
    (worst, student) => {
      const percent = getProfileCompletion(student);
      return worst === null || percent < worst.percent ? { student, percent } : worst;
    },
    null,
  );

  return (
    <section
      data-slot="dashboard-focus-note"
      aria-labelledby="dashboard-focus-note-title"
      className="flex flex-col rounded-card bg-card p-6 shadow-sm sm:px-7.5 sm:py-7"
    >
      <h2
        id="dashboard-focus-note-title"
        className="text-meta font-semibold tracking-overline text-body uppercase"
      >
        {t('focusEyebrow')}
      </h2>
      {focus === null ? (
        <p className="mt-3.5 flex-1 text-body-lg text-foreground">{t('focusBodyEmpty')}</p>
      ) : (
        <>
          <p className="mt-3.5 flex-1 text-body-lg text-balance text-foreground">
            {focus.percent === 100
              ? t('focusBodyComplete', { name: getStudentDisplayName(focus.student, t('unknownProfile')) })
              : t('focusBodyIncomplete', {
                  name: getStudentDisplayName(focus.student, t('unknownProfile')),
                  percent: focus.percent,
                  missing: getReadinessFields(focus.student).filter((field) => !field.filled).length,
                })}
          </p>
          <div className="mt-5 flex items-center gap-3 border-t border-divider pt-4.5">
            <AvatarTint
              initials={getStudentInitials(focus.student)}
              tone={getAvatarTone(focus.student.documentId)}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-body-sm font-semibold text-foreground">
                {getStudentDisplayName(focus.student, t('unknownProfile'))}
              </p>
              <p className="truncate text-meta text-body">
                {getDashboardYearLabel(focus.student, (level) =>
                  t('yearLevelOption', { level }),
                ) ?? t('profileMetaMissing')}
              </p>
            </div>
            <Link
              href={`/dashboard/children/${focus.student.documentId}`}
              className="group inline-flex min-h-11 flex-none items-center gap-1.5 rounded-lg px-2.5 text-body-sm font-semibold text-primary transition-colors duration-200 ease-out-expo hover:bg-blue-50 hover:text-blue-700 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none"
            >
              {t('viewProfile')}
              <ArrowRight
                aria-hidden="true"
                className="size-3.5 transition-transform duration-200 ease-out-expo group-hover:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none"
              />
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
