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

import type { OpsImportCreateTableProps } from '@/modules/ops/types/components.types';

// The create bucket: every row the commit would add. The columns are the
// VERSIONED template's own — given name, family name, date of birth, year
// level, home language — plus the optional student key. There is deliberately
// no class column: the class comes from the picker, so showing it per row would
// suggest a csv could override it. No email column exists in this template.
export function OpsImportCreateTable({ rows }: OpsImportCreateTableProps) {
  const t = useTranslations('Ops.import');

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-foreground">{t('createHeading')}</h3>
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('columnRow')}</TableHead>
              <TableHead>{t('columnGivenName')}</TableHead>
              <TableHead>{t('columnFamilyName')}</TableHead>
              <TableHead>{t('columnDob')}</TableHead>
              <TableHead>{t('columnYearLevel')}</TableHead>
              <TableHead>{t('columnLanguage')}</TableHead>
              <TableHead>{t('columnStudentKey')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.row}>
                <TableCell>{row.row}</TableCell>
                <TableCell>{row.given_name}</TableCell>
                <TableCell>{row.family_name}</TableCell>
                <TableCell>{row.date_of_birth}</TableCell>
                <TableCell>{row.year_level}</TableCell>
                <TableCell>{row.first_language}</TableCell>
                <TableCell>{row.student_key ?? ''}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
