'use client';

import { format } from 'date-fns';
import { useTranslations } from 'next-intl';

import { Badge, type BadgeProps, TableCell, TableRow } from '@/modules/design-system';
import { StaffRowActions } from '@/modules/teachers/components/StaffRowActions';
import type { StaffRow, StaffRowStatus } from '@/modules/teachers/types/teachers.types';

import type { StaffTableRowProps } from '@/modules/teachers/types/components.types';
import { STATUS_VARIANTS } from '@/modules/teachers/constants/components.constants';

// One merged staff row: a live account (classes listed) or an open invitation
// (join note + expiry under the status badge).
export function StaffTableRow({ row }: StaffTableRowProps) {
  const t = useTranslations('Teachers.table');
  const name = `${row.first_name} ${row.last_name}`.trim() || row.email;

  return (
    <TableRow data-status={row.status}>
      <TableCell className="font-medium text-foreground">{name}</TableCell>
      <TableCell>{row.email}</TableCell>
      <TableCell>
        {row.kind === 'invitation'
          ? t('classesPending')
          : row.classes.length > 0
            ? row.classes.map((klass) => klass.name).join(', ')
            : t('classesNone')}
      </TableCell>
      <TableCell>
        <div className="flex flex-col items-start gap-1">
          <Badge variant={STATUS_VARIANTS[row.status]}>{t(`status.${row.status}`)}</Badge>
          {row.expires_at ? (
            <span className="text-xs text-muted-foreground">
              {t('expiresOn', { date: format(new Date(row.expires_at), 'd MMM yyyy') })}
            </span>
          ) : null}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <StaffRowActions row={row} />
      </TableCell>
    </TableRow>
  );
}
