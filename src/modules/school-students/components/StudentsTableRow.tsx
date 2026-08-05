'use client';

import { useTranslations } from 'next-intl';

import { StatusPill, TableCell, TableRow } from '@/modules/design-system';
import { StudentLevelBadge } from '@/modules/school-students/components/StudentLevelBadge';
import { StudentRowActions } from '@/modules/school-students/components/StudentRowActions';
import { studentDisplayName } from '@/modules/school-students/hooks/use-student-row-actions';
import { toFirstLanguage } from '@/modules/school-students/lib/student-level';

import type { StudentsTableRowProps } from '@/modules/school-students/types/components.types';

// One spec §4 roster row: Name | Class | First language | Level | Diagnostic.
// The name is the row's own control and opens the student's detail/edit view.
// The C-CHD-05 email-fix flag and the archived state keep their pills beside it
// — the reshaped table has no status column left to carry them.
export function StudentsTableRow({ student, onOpen }: StudentsTableRowProps) {
  const t = useTranslations('SchoolStudents');
  const language = toFirstLanguage(student.first_language);

  return (
    <TableRow>
      <TableCell className="font-medium">
        <span className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpen}
            className="rounded-sm text-left font-medium text-foreground underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            {studentDisplayName(student)}
          </button>
          {student.email_fix_requested ? (
            <StatusPill tone="warning">{t('table.emailFixRequested')}</StatusPill>
          ) : null}
          {student.status === 'archived' ? (
            <StatusPill tone="neutral">{t('table.statusArchived')}</StatusPill>
          ) : null}
        </span>
      </TableCell>
      <TableCell>
        {student.class?.name ?? (
          <span className="text-muted-foreground">{t('table.classNone')}</span>
        )}
      </TableCell>
      <TableCell>
        {language ? (
          t(`form.firstLanguageOption.${language}`)
        ) : (
          <span className="text-muted-foreground">{t('table.notSet')}</span>
        )}
      </TableCell>
      <TableCell>
        <StudentLevelBadge phase={student.acara_phase} />
      </TableCell>
      <TableCell className="text-center text-muted-foreground">{t('table.notSet')}</TableCell>
      <TableCell className="text-right">
        <StudentRowActions student={student} onEdit={onOpen} />
      </TableCell>
    </TableRow>
  );
}
