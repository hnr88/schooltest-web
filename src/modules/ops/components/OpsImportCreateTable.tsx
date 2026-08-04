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
import type { ImportPreview } from '@/modules/ops/schemas/import.schema';

import type { OpsImportCreateTableProps } from '@/modules/ops/types/components.types';

// The C-IMP-01 create bucket (task 67): every row the commit would add, with
// the normalised picklist values the server resolved (display spellings from
// the template are already mapped to the enum keys).
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
              <TableHead>{t('columnFirstName')}</TableHead>
              <TableHead>{t('columnLastName')}</TableHead>
              <TableHead>{t('columnEmail')}</TableHead>
              <TableHead>{t('columnLanguage')}</TableHead>
              <TableHead>{t('columnClass')}</TableHead>
              <TableHead>{t('columnProficiency')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.row}>
                <TableCell>{row.row}</TableCell>
                <TableCell>{row.given_name}</TableCell>
                <TableCell>{row.family_name ?? ''}</TableCell>
                <TableCell>{row.email}</TableCell>
                <TableCell>{row.first_language}</TableCell>
                <TableCell>{row.class_name}</TableCell>
                <TableCell>{row.acara_phase ?? ''}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
