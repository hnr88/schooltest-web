'use client';

import { format } from 'date-fns';
import { useTranslations } from 'next-intl';

import { Badge, PersonCell, TableCell, TableRow, Tag } from '@/modules/design-system';
import { StaffRowActions } from '@/modules/teachers/components/StaffRowActions';

import type { StaffTableRowProps } from '@/modules/teachers/types/components.types';
import { STATUS_VARIANTS } from '@/modules/teachers/constants/components.constants';

// One merged staff row: a live account (a class chip each) or an open
// invitation (join note + expiry date). The spec's Name column is avatar +
// full name and its four columns are name / email / classes / actions, so an
// ACTIVE teacher — the only row the spec's table describes — renders exactly
// that. Rows the spec never contemplated (invited, expired, deactivated: the
// C-INV-02 merge) keep a badge in the identity cell, because without it a
// pending invitation is indistinguishable from a live account and the row's
// destructive actions differ.
export function StaffTableRow({ row }: StaffTableRowProps) {
  const t = useTranslations('Teachers.table');
  const name = `${row.first_name} ${row.last_name}`.trim() || row.email;

  return (
    <TableRow data-status={row.status}>
      <TableCell>
        <div className="flex items-center gap-2">
          <PersonCell
            name={name}
            secondary={
              row.expires_at
                ? t('expiresOn', { date: format(new Date(row.expires_at), 'd MMM yyyy') })
                : undefined
            }
          />
          {row.status === 'active' ? null : (
            <Badge variant={STATUS_VARIANTS[row.status]}>{t(`status.${row.status}`)}</Badge>
          )}
        </div>
      </TableCell>
      <TableCell>{row.email}</TableCell>
      <TableCell>
        {row.kind === 'invitation' ? (
          <span className="text-muted-foreground">{t('classesPending')}</span>
        ) : row.classes.length > 0 ? (
          <span className="flex flex-wrap gap-1.5">
            {row.classes.map((klass) => (
              <Tag key={klass.documentId} label={klass.name} />
            ))}
          </span>
        ) : (
          <span className="text-muted-foreground">{t('noValue')}</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <StaffRowActions row={row} />
      </TableCell>
    </TableRow>
  );
}
