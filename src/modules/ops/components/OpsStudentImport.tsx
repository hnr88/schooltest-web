'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Alert, Button, Input, Label, Textarea } from '@/modules/design-system';
import { OpsImportPreviewTables } from '@/modules/ops/components/OpsImportPreviewTables';
import { useStudentImport } from '@/modules/ops/hooks/use-student-import';

import type { OpsStudentImportProps } from '@/modules/ops/types/components.types';

// The parser's own contract (schooltest-api/src/api/ops/lib/import.constants.ts
// TEMPLATE_COLUMNS) — the header a CSV must carry for the preview to accept it.
// Duplicated here only as the download-template payload; drift is caught
// loudly at preview time by the server's "missing template columns" 400.
const IMPORT_TEMPLATE_COLUMNS = [
  'first name',
  'last name',
  'email',
  'first language',
  'class',
  'proficiency level',
] as const;

function downloadTemplate(): void {
  const blob = new Blob([`${IMPORT_TEMPLATE_COLUMNS.join(',')}\n`], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'schooltest-student-import-template.csv';
  anchor.click();
  URL.revokeObjectURL(url);
}

// Ops bulk student import panel (task 67, C-IMP-01/02, mvp-updates section
// 4.1.5; drop zone + template download + inline error added in task 026):
// drop or pick the completed template spreadsheet, or paste the CSV, preview
// what would be created/skipped/rejected, then commit. The commit re-sends the
// same csv and the server re-validates it - nothing here is client-side-only
// validation. Every count shown comes from the server's preview payload; the
// drop zone's own states (idle / dragging / file-ready) are UI state, and the
// ready line shows the file's real name, never a row count the server has not
// produced yet.
export function OpsStudentImport({ documentId }: OpsStudentImportProps) {
  const t = useTranslations('Ops.import');
  const importer = useStudentImport(documentId);
  const [dragging, setDragging] = useState(false);

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void importer.onFile(file);
  };

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
        <div
          data-surface="ops-import-dropzone"
          data-dragging={dragging || undefined}
          data-loaded={importer.fileName ?? undefined}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`flex flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-6 text-center transition-colors ${
            dragging ? 'border-primary bg-secondary' : 'border-border bg-background'
          }`}
        >
          <p className="text-sm font-semibold text-foreground">
            {dragging ? t('dropActive') : t('dropTitle')}
          </p>
          <p className="text-meta text-body">{t('dropHint')}</p>
          {importer.fileName ? (
            <p data-surface="ops-import-file-ready" className="text-meta font-medium text-foreground">
              {t('dropReady', { name: importer.fileName })}
            </p>
          ) : null}
          <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
            <Label htmlFor="ops-import-file" className="sr-only">
              {t('fileLabel')}
            </Label>
            <Input
              id="ops-import-file"
              type="file"
              accept=".csv,text/csv,text/plain"
              className="max-w-72"
              onChange={(event) => void importer.onFile(event.target.files?.[0])}
            />
            <Button type="button" variant="outline" onClick={downloadTemplate}>
              {t('templateButton')}
            </Button>
          </div>
        </div>
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
      {importer.errorKind ? (
        <Alert variant="error" title={t(importer.errorKind === 'forbidden' ? 'forbiddenToast' : 'errorToast')}>
          {t(importer.errorKind === 'forbidden' ? 'forbiddenDescription' : 'errorDescription')}
        </Alert>
      ) : null}
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
