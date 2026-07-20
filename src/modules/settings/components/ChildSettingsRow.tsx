'use client';

import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { PresenceAvatar } from '@/modules/design-system';
import { getInitials } from '@/modules/children';
import type { StudentListRow } from '@/modules/dashboard';

interface ChildSettingsRowProps {
  student: StudentListRow;
}

export function ChildSettingsRow({ student }: ChildSettingsRowProps) {
  const t = useTranslations('Children');
  const name = `${student.given_name} ${student.family_name}`;

  return (
    <li>
      <Link
        href={`/dashboard/children/${student.documentId}`}
        aria-label={t('viewProfileLabel', { name })}
        className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2 transition-colors duration-150 ease-out hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none"
      >
        <span className="flex min-w-0 items-center gap-3">
          <PresenceAvatar initials={getInitials(student.given_name, student.family_name)} />
          <span className="truncate font-semibold text-foreground">{name}</span>
        </span>
        <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      </Link>
    </li>
  );
}
