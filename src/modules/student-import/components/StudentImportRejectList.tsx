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

import type { StudentImportRejectListProps } from '@/modules/student-import/types/components.types';

// PER-ROW reporting for the rows an import could not take — the ONE list both
// school-admin import dialogs render, in the same row+reason shape the ops
// portal's reject table uses.
//
// Two sources, one presentation: BEFORE a submit the client parser's own
// errors (its reason keys, translated here), and AFTER a commit the SERVER's
// rejected rows, which are authoritative because the server is what refused
// them. The server list wins whenever it exists, so no row is reported twice.
//
// It is deliberately a LIST, not a count: "2 rows could not be read" tells an
// admin nothing about which lines to fix, and the good rows of the same file
// are now imported, so the only thing left to act on is these lines.
export function StudentImportRejectList({
  parseErrors,
  serverRejects,
}: StudentImportRejectListProps) {
  const t = useTranslations('StudentImport');
  const rows =
    serverRejects.length > 0
      ? serverRejects.map((reject) => ({ row: reject.row, reason: reject.reason }))
      : parseErrors.map((error) => ({ row: error.line, reason: t(`reasons.${error.reason}`) }));

  if (rows.length === 0) return null;

  return (
    <div data-slot="student-import-rejects" className="flex flex-col gap-2">
      <h3 className="text-meta font-semibold text-destructive">
        {t('rejectHeading', { count: rows.length })}
      </h3>
      <div className="max-h-48 overflow-y-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('rejectColumnRow')}</TableHead>
              <TableHead>{t('rejectColumnReason')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((entry, index) => (
              <TableRow key={`${entry.row}-${index}`}>
                <TableCell>{entry.row}</TableCell>
                <TableCell>{entry.reason}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
