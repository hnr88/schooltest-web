'use client';

import { useTranslations } from 'next-intl';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/modules/design-system';
import { StaffTableRow } from '@/modules/teachers/components/StaffTableRow';

import type { TeachersTableProps } from '@/modules/teachers/types/components.types';

// Merged staff table (C-TCH-01 accounts + C-INV-02 open invitations): name,
// email, classes, actions. Dumb renderer — merging/sorting lives in
// useStaffRows, actions in StaffRowActions.
export function TeachersTable({ rows }: TeachersTableProps) {
  const t = useTranslations('Teachers.table');

  return (
    <div className="rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('columnName')}</TableHead>
            <TableHead>{t('columnEmail')}</TableHead>
            <TableHead>{t('columnClasses')}</TableHead>
            <TableHead className="text-right">
              <span className="sr-only">{t('columnActions')}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <StaffTableRow key={`${row.kind}-${row.documentId}`} row={row} />
          ))}
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                {t('empty')}
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}
