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
  const teacher = teacherNames(row.teachers);

  return (
    <TableRow className="group relative">
      <TableCell className="font-medium">
        <Link
          href={`/dashboard/school/classes/${row.documentId}`}
          className="rounded-sm underline-offset-4 transition-colors duration-150 after:absolute after:inset-0 group-hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
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
      <TableCell className="text-center tabular-nums">{testsCompleted}</TableCell>
      <TableCell className="relative text-right">
        <ClassRowActions schoolClass={row} onEdit={onEdit} />
      </TableCell>
    </TableRow>
  );
}
