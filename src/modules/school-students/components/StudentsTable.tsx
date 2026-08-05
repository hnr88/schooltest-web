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
import { StudentsTableRow } from '@/modules/school-students/components/StudentsTableRow';

import type { StudentsTableProps } from '@/modules/school-students/types/components.types';

// Spec §4 roster table. Dumb renderer — the row owns its cells, and the
// edit/archive wiring lives in StudentRowActions and the screen.
export function StudentsTable({ rows, filtered, onOpen }: StudentsTableProps) {
  const t = useTranslations('SchoolStudents.table');

  return (
    <div className="rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('columnName')}</TableHead>
            <TableHead>{t('columnClass')}</TableHead>
            <TableHead>{t('columnFirstLanguage')}</TableHead>
            <TableHead>{t('columnLevel')}</TableHead>
            <TableHead className="text-center">{t('columnDiagnostic')}</TableHead>
            <TableHead className="text-right">
              <span className="sr-only">{t('columnActions')}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <StudentsTableRow key={row.documentId} student={row} onOpen={() => onOpen(row)} />
          ))}
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                {filtered ? t('emptyFiltered') : t('empty')}
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}
