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
import { OpsImportCreateTable } from '@/modules/ops/components/OpsImportCreateTable';
import type { ImportPreview } from '@/modules/ops/schemas/import.schema';

import type { OpsImportPreviewTablesProps } from '@/modules/ops/types/components.types';

// The C-IMP-01 preview read-out (task 67): the summary sentence plus one table
// per outcome bucket - will be created, already in this school (email match,
// never duplicated) and needs fixing (row number + reason from the server).
export function OpsImportPreviewTables({ preview }: OpsImportPreviewTablesProps) {
  const t = useTranslations('Ops.import');

  return (
    <div data-surface="ops-import-preview" className="flex flex-col gap-4">
      <p className="text-sm font-medium text-foreground">
        {t('previewSummary', {
          createCount: preview.create.length,
          skipCount: preview.skip_existing.length,
          rejectCount: preview.reject.length,
        })}
      </p>
      {preview.create.length > 0 ? <OpsImportCreateTable rows={preview.create} /> : null}
      {preview.skip_existing.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-foreground">{t('skipHeading')}</h3>
          <div className="rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('columnRow')}</TableHead>
                  <TableHead>{t('columnEmail')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.skip_existing.map((row) => (
                  <TableRow key={row.row}>
                    <TableCell>{row.row}</TableCell>
                    <TableCell>{row.email}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : null}
      {preview.reject.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-foreground">{t('rejectHeading')}</h3>
          <div className="rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('columnRow')}</TableHead>
                  <TableHead>{t('columnReason')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.reject.map((row) => (
                  <TableRow key={row.row}>
                    <TableCell>{row.row}</TableCell>
                    <TableCell>{row.reason}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
