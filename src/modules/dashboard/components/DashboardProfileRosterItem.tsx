'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { getStudentDisplayName, getStudentInitials } from '@/lib/student-name';
import { AvatarTint, DataGridRow, getAvatarTone } from '@/modules/design-system';
import { getDashboardEntryPlan } from '@/modules/dashboard/lib/dashboard-overview';
import type { StudentListRow } from '@/modules/dashboard/types/student.types';

interface DashboardProfileRosterItemProps {
  student: StudentListRow;
  last?: boolean;
}

function DashboardProfileRosterItem({ student, last }: DashboardProfileRosterItemProps) {
  const format = useFormatter();
  const t = useTranslations('Dashboard');
  const name = getStudentDisplayName(student, t('unknownProfile'));
  const yearLevel =
    student.current_year_level ??
    (student.year_level === null
      ? t('valueMissing')
      : t('yearLevelOption', { level: student.year_level }));
  const entryPlan = getDashboardEntryPlan(student) ?? t('valueMissing');
  const added = format.dateTime(new Date(student.createdAt), { dateStyle: 'medium' });

  return (
    <DataGridRow
      element="article"
      interactive
      last={last}
      className="grid-cols-row-compact md:grid-cols-profile-row"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <AvatarTint
          initials={getStudentInitials(student)}
          tone={getAvatarTone(student.documentId)}
        />
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-semibold text-foreground">{name}</span>
          <span className="truncate text-meta text-muted-foreground md:hidden">
            {t('rosterMobileMeta', { yearLevel, entryPlan, added })}
          </span>
        </div>
      </div>
      <span className="hidden truncate text-muted-foreground md:block">{yearLevel}</span>
      <span className="hidden truncate text-muted-foreground md:block">{entryPlan}</span>
      <span className="hidden truncate text-muted-foreground md:block">{added}</span>
      <Link
        href={`/dashboard/children/${student.documentId}`}
        aria-label={t('profileOpen', { name })}
        className="inline-flex min-h-11 items-center justify-self-end rounded-lg px-2.5 text-body-sm font-semibold text-primary transition-colors duration-200 ease-out-expo hover:bg-blue-50 hover:text-blue-700 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none"
      >
        {t('rosterView')}
      </Link>
    </DataGridRow>
  );
}

export { DashboardProfileRosterItem };
