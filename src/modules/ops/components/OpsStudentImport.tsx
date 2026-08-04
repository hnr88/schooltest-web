'use client';

import { useTranslations } from 'next-intl';

import { Button, Input, Label, Textarea } from '@/modules/design-system';
import { OpsImportPreviewTables } from '@/modules/ops/components/OpsImportPreviewTables';
import { useStudentImport } from '@/modules/ops/hooks/use-student-import';

import type { OpsStudentImportProps } from '@/modules/ops/types/components.types';

// Ops bulk student import panel (task 67, C-IMP-01/02, mvp-updates section
// 4.1.5): pick the completed template spreadsheet or paste the CSV, preview
// what would be created/skipped/rejected, then commit. The commit re-sends the
// same csv and the server re-validates it - nothing here is client-side-only
// validation.
export function OpsStudentImport({ documentId }: OpsStudentImportProps) {
  const t = useTranslations('Ops.import');
  const importer = useStudentImport(documentId);

  return (
    <section
      data-surface="ops-student-import"
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-foreground">{t('title')}</h2>
        <p className="text-sm text-body">{t('description')}</p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="ops-import-file">{t('fileLabel')}</Label>
        <Input
          id="ops-import-file"
          type="file"
          accept=".csv,text/csv,text/plain"
          onChange={(event) => void importer.onFile(event.target.files?.[0])}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="ops-import-csv">{t('pasteLabel')}</Label>
        <Textarea
          id="ops-import-csv"
          rows={8}
          placeholder={t('placeholder')}
          value={importer.csv}
          onChange={(event) => importer.onCsvChange(event.target.value)}
        />
      </div>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={importer.csv.trim() === ''}
          loading={importer.previewing}
          onClick={() => void importer.runPreview()}
        >
          {t('previewButton')}
        </Button>
        <Button
          type="button"
          disabled={!importer.preview || importer.preview.create.length === 0}
          loading={importer.committing}
          onClick={() => void importer.runCommit()}
        >
          {t('commitButton')}
        </Button>
      </div>
      {importer.preview ? <OpsImportPreviewTables preview={importer.preview} /> : null}
      {importer.result ? (
        <p data-surface="ops-import-result" className="text-sm font-medium text-foreground">
          {t('resultSummary', {
            created: importer.result.created,
            skipped: importer.result.skipped,
            rejected: importer.result.rejected.length,
          })}
        </p>
      ) : null}
    </section>
  );
}
