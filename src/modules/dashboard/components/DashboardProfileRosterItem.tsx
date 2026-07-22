'use client';

import { ArrowUpRight, CalendarDays, GraduationCap } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { getStudentDisplayName, getStudentInitials } from '@/lib/student-name';
import { Badge, PresenceAvatar } from '@/modules/design-system';
import {
  getDashboardEntryPlan,
  getDashboardYearLevel,
  hasEntryPlan,
} from '@/modules/dashboard/lib/dashboard-overview';
import type { StudentListRow } from '@/modules/dashboard/types/student.types';

function DashboardProfileRosterItem({ student }: { student: StudentListRow }) {
  const format = useFormatter();
  const t = useTranslations('Dashboard');
  const tChildren = useTranslations('Children');
  const name = getStudentDisplayName(student, tChildren('unknownStudent'));
  const entryPlan = getDashboardEntryPlan(student);
  const yearLevel = getDashboardYearLevel(student);
  const entryPlanReady = hasEntryPlan(student);

  return (
    <article
      data-slot="dashboard-profile-roster-item"
      className="rounded-xl border border-border bg-muted/30 p-4"
    >
      <div className="flex items-start gap-3">
        <PresenceAvatar initials={getStudentInitials(student)} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-foreground">{name}</h3>
          <p className="mt-1 text-caption text-muted-foreground">
            {t('addedOn', {
              date: format.dateTime(new Date(student.createdAt), { dateStyle: 'medium' }),
            })}
          </p>
        </div>
        <Badge variant={entryPlanReady ? 'success' : 'warning'} className="shrink-0">
          {entryPlanReady ? t('entryPlanSet') : t('entryPlanMissing')}
        </Badge>
      </div>
      <dl className="mt-4 grid gap-3 border-y border-border py-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="flex items-center gap-2 text-muted-foreground">
            <GraduationCap aria-hidden="true" className="size-4 text-primary" />
            {t('profileCurrentYear')}
          </dt>
          <dd className="mt-1 font-medium text-foreground">
            {yearLevel ?? tChildren('notAvailable')}
          </dd>
        </div>
        <div>
          <dt className="flex items-center gap-2 text-muted-foreground">
            <CalendarDays aria-hidden="true" className="size-4 text-teal-600" />
            {t('profileTargetEntry')}
          </dt>
          <dd className="mt-1 font-medium text-foreground">{entryPlan ?? t('profileNoEntryPlan')}</dd>
        </div>
      </dl>
      <Link
        href={`/dashboard/children/${student.documentId}`}
        aria-label={t('profileOpen', { name })}
        className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-primary transition-colors duration-150 ease-out hover:bg-blue-50 hover:text-blue-700 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none dark:hover:bg-blue-950"
      >
        {t('profileOpen', { name })}
        <ArrowUpRight aria-hidden="true" className="size-4" />
      </Link>
    </article>
  );
}

export { DashboardProfileRosterItem };
