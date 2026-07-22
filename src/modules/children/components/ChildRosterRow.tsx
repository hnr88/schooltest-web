'use client';

import { ChevronRight } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { getStudentDisplayName, getStudentInitials } from '@/lib/student-name';
import { AvatarTint, DataGridRow, getAvatarTone, StatusPill } from '@/modules/design-system';
import { ChildrenRowActions } from '@/modules/children/components/ChildrenRowActions';
import { ChildRosterFact } from '@/modules/children/components/ChildRosterFact';
import { getStatusMeta, getStatusTone } from '@/modules/children/lib/student-display';
import { getRosterFacts } from '@/modules/children/lib/roster-facts';
import type { StudentListRow } from '@/modules/dashboard';

interface ChildRosterRowProps {
  student: StudentListRow;
  last: boolean;
}

// Canonical roster row: flush hairline grid row (never a card) — person cell,
// meta cells, status pill, actions. Below `lg` the meta cells fold into a
// two-column definition list with their column labels restored.
export function ChildRosterRow({ student, last }: ChildRosterRowProps) {
  const t = useTranslations('Children');
  const format = useFormatter();
  const tWizard = useTranslations('StudentWizard');
  const name = getStudentDisplayName(student, t('unknownStudent'));
  const status = getStatusMeta(student.status);
  const facts = getRosterFacts(student, (year) => tWizard('education.yearOption', { n: year }));

  return (
    <DataGridRow
      element="article"
      interactive
      last={last}
      aria-label={t('childCardLabel', { name })}
      className="group relative grid-cols-1 gap-y-3 px-4 py-4 lg:grid-cols-roster-row lg:px-5 lg:py-3"
    >
      <div className="flex min-w-0 items-center gap-3 pr-12 lg:pr-0">
        <AvatarTint initials={getStudentInitials(student)} tone={getAvatarTone(student.documentId)} />
        <Link
          href={`/dashboard/children/${student.documentId}`}
          aria-label={t('viewProfileLabel', { name })}
          className="relative min-w-0 rounded-sm font-semibold text-foreground transition-colors duration-200 ease-out-expo after:absolute after:-inset-x-1 after:-inset-y-3 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none"
        >
          {/* truncation lives on the inner span: `overflow-hidden` on the link
              itself would clip the ::after that grows the 20px row of text to a
              44px pointer target. */}
          <span className="block truncate">{name}</span>
        </Link>
        <ChevronRight
          aria-hidden="true"
          className="hidden size-4 shrink-0 -translate-x-1 text-slate-400 opacity-0 transition duration-200 ease-out-expo group-hover:translate-x-0 group-hover:opacity-100 motion-reduce:transform-none motion-reduce:transition-none lg:block"
        />
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 lg:contents">
        <ChildRosterFact label={t('columnYearLevel')} value={facts.yearLevel} />
        <ChildRosterFact label={t('columnTargetEntry')} value={facts.targetEntry} />
        <ChildRosterFact label={t('columnNationality')} value={facts.nationality} />
        <ChildRosterFact label={t('columnStatus')}>
          <StatusPill tone={getStatusTone(student.status)}>{t(status.labelKey)}</StatusPill>
        </ChildRosterFact>
        <ChildRosterFact
          label={t('columnAdded')}
          value={format.dateTime(new Date(student.createdAt), { dateStyle: 'medium' })}
          className="hidden lg:flex"
        />
      </dl>

      <div className="absolute top-3 right-3 lg:static lg:justify-self-end">
        <ChildrenRowActions student={student} />
      </div>
    </DataGridRow>
  );
}
