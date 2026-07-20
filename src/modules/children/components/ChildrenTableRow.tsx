'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { Badge, PresenceAvatar, TableCell, TableRow } from '@/modules/design-system';
import { ChildrenRowActions } from '@/modules/children/components/ChildrenRowActions';
import {
  getInitials,
  getStatusMeta,
  getTargetEntry,
  getYearLevelLabel,
} from '@/modules/children/lib/student-display';
import type { StudentListRow } from '@/modules/dashboard';

interface ChildrenTableRowProps {
  student: StudentListRow;
}

// C-UI-MYCHILDREN row: 34px initials avatar + name, nullable columns fall back to
// "—", uppercase status pill (§6), added date, and the actions dropdown.
export function ChildrenTableRow({ student }: ChildrenTableRowProps) {
  const t = useTranslations('Children');
  const format = useFormatter();
  const status = getStatusMeta(student.status);
  const yearLevel = getYearLevelLabel(student);
  const targetEntry = getTargetEntry(student);

  return (
    <TableRow className="transition-colors duration-150 ease-out hover:bg-muted/60 motion-reduce:transition-none">
      <TableCell>
        <div className="flex items-center gap-2.5">
          <PresenceAvatar initials={getInitials(student.given_name, student.family_name)} />
          <span className="font-semibold text-foreground">
            {student.given_name} {student.family_name}
          </span>
        </div>
      </TableCell>
      <TableCell className={student.nationality ? undefined : 'text-muted-foreground'}>
        {student.nationality ?? '—'}
      </TableCell>
      <TableCell className={yearLevel ? undefined : 'text-muted-foreground'}>
        {yearLevel ?? '—'}
      </TableCell>
      <TableCell className={targetEntry ? undefined : 'text-muted-foreground'}>
        {targetEntry ?? '—'}
      </TableCell>
      <TableCell>
        <Badge className={cn('uppercase tracking-wide', status.className)}>
          {t(status.labelKey)}
        </Badge>
      </TableCell>
      <TableCell>{format.dateTime(new Date(student.createdAt), { dateStyle: 'medium' })}</TableCell>
      <TableCell className="text-right">
        <ChildrenRowActions student={student} />
      </TableCell>
    </TableRow>
  );
}
