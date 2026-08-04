'use client';

import { useTranslations } from 'next-intl';

import {
  StatusPill,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/modules/design-system';
import { ChildRowActions } from '@/modules/school-children/components/ChildRowActions';
import { childDisplayName } from '@/modules/school-children/hooks/use-child-row-actions';
import type { SchoolChild } from '@/modules/school-children/types/school-children.types';

import type { ChildrenTableProps } from '@/modules/school-children/types/components.types';

// C-CHD-01 roster: name, class, status pill and the row actions. Dumb
// renderer — edit/archive wiring lives in ChildRowActions and the screen.
// Rows with the C-CHD-05 flag set show the email-fix badge (task 103) beside
// the name — the table has no email column, so the name cell is the identity
// anchor. Driven by the server flag only; editing the email (C-CHD-03)
// auto-clears it server-side.
export function ChildrenTable({ rows, filtered, onEdit }: ChildrenTableProps) {
  const t = useTranslations('SchoolChildren.table');

  return (
    <div className="rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('columnName')}</TableHead>
            <TableHead>{t('columnClass')}</TableHead>
            <TableHead>{t('columnStatus')}</TableHead>
            <TableHead className="text-right">
              <span className="sr-only">{t('columnActions')}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.documentId}>
              <TableCell className="font-medium">
                <span className="flex flex-wrap items-center gap-2">
                  {childDisplayName(row)}
                  {row.email_fix_requested ? (
                    <StatusPill tone="warning">{t('emailFixRequested')}</StatusPill>
                  ) : null}
                </span>
              </TableCell>
              <TableCell>
                {row.class?.name ?? (
                  <span className="text-muted-foreground">{t('classNone')}</span>
                )}
              </TableCell>
              <TableCell>
                <StatusPill tone={row.status === 'active' ? 'success' : 'neutral'}>
                  {row.status === 'active' ? t('statusActive') : t('statusArchived')}
                </StatusPill>
              </TableCell>
              <TableCell className="text-right">
                <ChildRowActions child={row} onEdit={() => onEdit(row)} />
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                {filtered ? t('emptyFiltered') : t('empty')}
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}
