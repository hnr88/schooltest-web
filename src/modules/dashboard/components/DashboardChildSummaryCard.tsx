'use client';

import { ArrowRight, CalendarClock, TriangleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { getStudentDisplayName, getStudentInitials } from '@/lib/student-name';
import {
  AvatarTint,
  getAvatarTone,
  InsightCallout,
  MiniStatTile,
  StatusPill,
} from '@/modules/design-system';
import { INSET_TILE } from '@/modules/dashboard/constants/dashboard.constants';
import {
  getDashboardEntryPlan,
  getProfileCompletion,
  hasEntryPlan,
} from '@/modules/dashboard/lib/dashboard-overview';
import type { StudentListRow } from '@/modules/dashboard/types/student.types';

function DashboardChildSummaryCard({ student }: { student: StudentListRow }) {
  const t = useTranslations('Dashboard');
  const name = getStudentDisplayName(student, t('unknownProfile'));
  const yearLevel =
    student.current_year_level ??
    (student.year_level === null ? null : t('yearLevelOption', { level: student.year_level }));
  const entryPlan = getDashboardEntryPlan(student);
  const planned = hasEntryPlan(student);
  const completion = getProfileCompletion(student);
  const meta = [yearLevel, student.nationality].filter(Boolean).join(' · ');

  return (
    <article
      data-slot="dashboard-child-summary"
      className="flex h-full flex-col gap-4 rounded-panel border border-border bg-card p-5.5 shadow-md transition duration-200 ease-out-expo hover:-translate-y-0.5 hover:shadow-lg motion-reduce:transform-none motion-reduce:transition-none"
    >
      <div className="flex items-center gap-3.5">
        <AvatarTint
          initials={getStudentInitials(student)}
          size="lg"
          tone={getAvatarTone(student.documentId)}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h3 className="truncate text-panel-title font-bold text-foreground">{name}</h3>
          <p className="truncate text-body-sm text-muted-foreground">
            {meta === '' ? t('profileMetaMissing') : meta}
          </p>
        </div>
        <Link
          href={`/dashboard/children/${student.documentId}`}
          aria-label={t('profileOpen', { name })}
          // The label is sr-only below sm, which collapses the drawn control to the
          // 14px arrow inside its 10px padding — 34px WIDE, a real pointer-scan fail
          // in the other dimension. min-h-11 answers the height; the ::after answers
          // the width without redrawing the hover pill.
          className="group relative inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-body-sm font-semibold text-primary transition-colors duration-200 ease-out-expo after:absolute after:inset-y-0 after:-inset-x-1.5 hover:bg-blue-50 hover:text-blue-700 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none"
        >
          <span className="sr-only sm:not-sr-only">{t('viewProfile')}</span>
          <ArrowRight
            aria-hidden="true"
            className="size-3.5 transition-transform duration-200 ease-out-expo group-hover:translate-x-0.5 motion-reduce:transition-none"
          />
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <MiniStatTile
          className={INSET_TILE}
          value={t('percentValue', { percent: completion })}
          label={t('profileReadiness')}
          tone={completion >= 80 ? 'positive' : 'default'}
        />
        <MiniStatTile
          className={INSET_TILE}
          value={yearLevel ?? t('valueMissing')}
          label={t('profileCurrentYear')}
        />
        <MiniStatTile
          className={INSET_TILE}
          value={student.target_entry_year ?? t('valueMissing')}
          label={t('profileTargetEntry')}
        />
      </div>

      {planned && entryPlan ? (
        <InsightCallout
          icon={CalendarClock}
          tone="info"
          action={<StatusPill tone="info">{t('entryPlanPill')}</StatusPill>}
        >
          {t('entryPlanScheduled', { plan: entryPlan })}
        </InsightCallout>
      ) : (
        <InsightCallout
          icon={TriangleAlert}
          tone="warning"
          action={<StatusPill tone="warning">{t('entryPlanNeededPill')}</StatusPill>}
        >
          {t('entryPlanMissingHint')}
        </InsightCallout>
      )}
    </article>
  );
}

export { DashboardChildSummaryCard };
