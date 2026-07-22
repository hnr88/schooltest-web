'use client';

import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { getStudentDisplayName, getStudentInitials } from '@/lib/student-name';
import { PresenceAvatar } from '@/modules/design-system';
import type { StudentListRow } from '@/modules/dashboard';

interface ChildSettingsRowProps {
  student: StudentListRow;
}

// Canonical roster row: a hairline between siblings, no per-row border or shadow.
// The link keeps a 44px pointer target via min-h-11 while the drawn row stays on
// the §36 12px rhythm.
// PresenceAvatar, not PersonCell/AvatarTint: the tint palette's teal pair
// (bg-teal-100 / text-teal-700) measures 4.33:1 and axe fails it as serious, so a
// name that hashed to teal would break the settings a11y assertion.
// The secondary line is the REAL `year_level` from /api/my/students, formatted with
// the shared "Year {n}" message the children roster already uses. A row whose year
// level is null simply has no second line — nothing is invented to fill it.
export function ChildSettingsRow({ student }: ChildSettingsRowProps) {
  const t = useTranslations('Children');
  const tWizard = useTranslations('StudentWizard');
  const name = getStudentDisplayName(student, t('unknownStudent'));
  const yearLevel =
    student.year_level === null ? null : tWizard('education.yearOption', { n: student.year_level });

  return (
    <li className="border-b border-divider last:border-b-0">
      <Link
        href={`/dashboard/children/${student.documentId}`}
        aria-label={t('viewProfileLabel', { name })}
        className="-mx-2 flex min-h-11 items-center justify-between gap-3 rounded-tile px-2 py-2.5 transition-colors duration-200 ease-out-expo hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none"
      >
        <span className="flex min-w-0 items-center gap-2.75">
          <PresenceAvatar initials={getStudentInitials(student)} className="size-8.5" />
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-body-sm font-semibold text-foreground">{name}</span>
            {/* --color-body (#475569, 7.5:1), NOT --muted-foreground: #64748B is
                4.76:1 at rest but the tab panel's fade-in composites it to 3.97:1,
                and axe failed exactly this 12.5px line as SERIOUS the first time
                this row shipped a secondary. */}
            {yearLevel ? <span className="truncate text-meta text-body">{yearLevel}</span> : null}
          </span>
        </span>
        <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-slate-400" />
      </Link>
    </li>
  );
}
