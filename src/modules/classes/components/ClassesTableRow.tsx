'use client';

import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { ClassRowActions } from '@/modules/classes/components/ClassRowActions';
import { teacherNames } from '@/modules/classes/lib/classes-table.helpers';
import { TableCell, TableRow } from '@/modules/design-system';

import type { ClassesTableRowProps } from '@/modules/classes/types/components.types';

// One spec §2 roster row. The class link is STRETCHED over the whole row
// (`after:inset-0` against the relatively positioned row) rather than a tr
// onClick, so the row navigates to the existing class detail while keeping real
// link semantics, a focus ring and keyboard access. The actions cell is
// positioned itself, so it paints above that overlay and stays clickable.
export function ClassesTableRow({ row, testsCompleted, onEdit }: ClassesTableRowProps) {
  const t = useTranslations('Classes.table');
  // Reused rather than duplicated: the participation monitor already ships
  // "Test A" / "Test B" in every locale, and these are the same two test slots.
  const tt = useTranslations('SchoolAdmin.participation.columns');
  const teacher = teacherNames(row.teachers);

  return (
    <TableRow className="group relative">
      <TableCell className="font-medium">
        <Link
          href={`/dashboard/school/classes/${row.documentId}`}
          className="rounded-sm underline-offset-4 transition-colors duration-150 group-hover:text-primary after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {row.name}
        </Link>
      </TableCell>
      <TableCell className="text-body">
        {teacher === '' ? (
          <span className="text-muted-foreground">{t('teacherNone')}</span>
        ) : (
          teacher
        )}
      </TableCell>
      <TableCell className="text-center tabular-nums">{row.student_count}</TableCell>
      <TableCell className="text-center">
        {testsCompleted === null ? (
          <span className="text-muted-foreground">{t('unknown')}</span>
        ) : (
          <span className="flex flex-col items-center gap-1 sm:flex-row sm:justify-center sm:gap-4">
            <span className="inline-flex items-baseline gap-1.5 whitespace-nowrap">
              <span className="text-muted-foreground">{tt('testA')}</span>
              <span className="tabular-nums">{testsCompleted.testA}</span>
            </span>
            <span className="inline-flex items-baseline gap-1.5 whitespace-nowrap">
              <span className="text-muted-foreground">{tt('testB')}</span>
              <span className="tabular-nums">{testsCompleted.testB}</span>
            </span>
          </span>
        )}
      </TableCell>
      <TableCell className="relative text-right">
        <ClassRowActions schoolClass={row} onEdit={onEdit} />
      </TableCell>
    </TableRow>
  );
}
