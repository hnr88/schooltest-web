'use client';

import { useTranslations } from 'next-intl';

import { PendingTeacherBadge } from '@/modules/classes/components/PendingTeacherBadge';
import { teacherNames } from '@/modules/classes/lib/classes-table.helpers';
import type { SchoolClass } from '@/modules/classes/types/classes.types';

// The Classes table "Teacher" cell. BUG-006: a class waiting on an invited
// teacher reads "Invited (pending)" beside their name — distinct from an active
// teacher — and a lapsed (expired / revoked) invitation reads as a call to
// reassign the teacher instead of silently showing no teacher.
export function ClassTeacherCell({ row }: { row: SchoolClass }) {
  const table = useTranslations('Classes.table');
  const names = teacherNames(row.teachers);
  const pending = row.pending_teacher;

  if (names === '' && pending === null) {
    return <span className="text-[#9AA6B8]">{table('teacherNone')}</span>;
  }

  return (
    <span className="flex min-w-0 flex-col gap-0.5">
      {names !== '' ? (
        <span className="block truncate" title={names}>
          {names}
        </span>
      ) : null}
      {pending ? <PendingTeacherBadge pending={pending} showName={names === ''} /> : null}
    </span>
  );
}
