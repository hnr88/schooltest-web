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

import type { OpsImportPreviewTablesProps } from '@/modules/ops/types/components.types';

// The preview read-out: the summary sentence plus one table per outcome bucket
// — will be created, already in this school, and needs fixing (row number +
// reason from the server). A skipped row names the STUDENT it matched by
// documentId: identity is resolved by student key or by name+date of birth, so
// there is no email to show and a display name would not be an identifier.
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
                  <TableHead>{t('columnMatchedStudent')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.skip_existing.map((row) => (
                  <TableRow key={row.row}>
                    <TableCell>{row.row}</TableCell>
                    <TableCell>{row.student_documentId}</TableCell>
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
