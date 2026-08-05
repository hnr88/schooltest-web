'use client';

import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { StatusPill, TableCell, TableRow } from '@/modules/design-system';
import { StudentLevelBadge } from '@/modules/school-students/components/StudentLevelBadge';
import { StudentRowActions } from '@/modules/school-students/components/StudentRowActions';
import { studentDisplayName } from '@/modules/school-students/hooks/use-student-row-actions';
import { toDiagnosticStatus, toFirstLanguage } from '@/modules/school-students/lib/student-level';

import type { StudentsTableRowProps } from '@/modules/school-students/types/components.types';

// One spec §4 roster row: Name | Class | First language | Level | Diagnostic.
// Spec §4 "each row is clickable and navigates to an individual student detail
// view": the name link is STRETCHED over the whole row (`after:inset-0`
// against the relatively positioned row, the same idiom ClassesTableRow uses),
// so a click anywhere in the row lands on /students/[documentId] while the row
// still holds exactly ONE row-level control — a real link with real link
// semantics, a focus ring and keyboard access, not a tr onClick and not a
// second nested target. Editing stays reachable in the actions menu, which is
// positioned itself so it paints above that overlay and stays clickable. The
// C-CHD-05 email-fix flag and the archived state keep their pills beside the
// name — the reshaped table has no status column left to carry them.
export function StudentsTableRow({ student, onEdit }: StudentsTableRowProps) {
  const t = useTranslations('SchoolStudents');
  const language = toFirstLanguage(student.first_language);

  return (
    <TableRow className="group relative">
      <TableCell className="font-medium">
        <span className="flex flex-wrap items-center gap-2">
          <Link
            href={`/dashboard/school/students/${student.documentId}`}
            className="cursor-pointer rounded-sm text-left font-medium text-foreground underline-offset-4 transition-colors duration-150 group-hover:text-primary group-hover:underline after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {studentDisplayName(student)}
          </Link>
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
      <TableCell className="text-center text-muted-foreground">
        {t(`table.diagnosticOption.${toDiagnosticStatus(student.diagnostic_status)}`)}
      </TableCell>
      <TableCell className="relative text-right">
        <StudentRowActions student={student} onEdit={onEdit} />
      </TableCell>
    </TableRow>
  );
}
