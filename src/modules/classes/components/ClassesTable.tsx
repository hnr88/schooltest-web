'use client';

import { useTranslations } from 'next-intl';

import { ClassesTableRow } from '@/modules/classes/components/ClassesTableRow';
import { formatTestsCompleted } from '@/modules/classes/lib/classes-table.helpers';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/modules/design-system';

import type { ClassesTableProps } from '@/modules/classes/types/components.types';

// Spec §2 roster: class, assigned teacher, student count and the per-test
// completion. Dumb renderer — edit/delete wiring lives in ClassRowActions and
// the completion lookup in classes-table.helpers.
export function ClassesTable({ rows, completions, onEdit }: ClassesTableProps) {
  const t = useTranslations('Classes.table');

  return (
    <div className="rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('columnClass')}</TableHead>
            <TableHead>{t('columnTeacher')}</TableHead>
            <TableHead className="text-center">{t('columnStudents')}</TableHead>
            <TableHead className="text-center">{t('columnTestsCompleted')}</TableHead>
            <TableHead className="text-right">
              <span className="sr-only">{t('columnActions')}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <ClassesTableRow
              key={row.documentId}
              row={row}
              testsCompleted={formatTestsCompleted(
                completions,
                row.documentId,
                row.student_count,
                t('unknown'),
              )}
              onEdit={() => onEdit(row)}
            />
          ))}
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                {t('empty')}
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}
