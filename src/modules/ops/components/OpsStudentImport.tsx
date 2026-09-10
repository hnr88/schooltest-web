'use client';

import { Info } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { PORTAL_IMPORT_TEMPLATE_COLUMNS } from '@schooltest/ops-contracts';

import { Alert, Button, Input, Label, ProgressBar, SelectField } from '@/modules/design-system';
import { OpsImportPreviewTables } from '@/modules/ops/components/OpsImportPreviewTables';
import { useStudentImport } from '@/modules/ops/hooks/use-student-import';
import { useClassesListQuery } from '@/modules/ops/queries/use-classes-list.query';
import { useImportTemplateDownload } from '@/modules/ops/queries/use-import-template.query';
import type { ImportCardState, OpsStudentImportPanelProps } from '@/modules/ops/types/import.types';

/** Card tone per pictured state. The card is rendered, never assigned. */
const CARD_TONE: Record<ImportCardState, 'info' | 'success' | 'warning' | 'error' | null> = {
  idle: null,
  validating: 'info',
  ready: 'success',
  rowErrors: 'warning',
  dupes: 'warning',
  badType: 'error',
  tooBig: 'error',
  noRows: 'error',
  uploading: 'info',
  failed: 'error',
};

// The ops student import surface. Every card the HTML draws — idle,
// validating, ready, row errors, dupes, bad type, too big, no rows,
// uploading, failed — is a render of `importer.card`, which the hook derives
// from server state. The class comes from the picker and rides in the request
// body; it is never a csv column. Progress is the receipt's own processed/total
// and nothing else, so the bar is indeterminate rather than animated when the
// server has no numbers yet.
//
// ops/26 — mounted twice: standalone as the `OpsSchoolDetail.tsx` panel
// (task 43 removes that mount later), and inside `OpsStudentImportDialog` for
// the design's modal. Both share this one implementation — Law 2.
export function OpsStudentImport({
  documentId,
  initialClassDocumentId,
  onBusyChange,
  hideHeader,
}: OpsStudentImportPanelProps) {
  const t = useTranslations('Ops.import');
  const importer = useStudentImport(documentId, { initialClassDocumentId });
  const template = useImportTemplateDownload(documentId);
  const classes = useClassesListQuery(documentId, { page: 1, pageSize: 200 }, true);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    onBusyChange?.(importer.busy);
  }, [importer.busy, onBusyChange]);

  const tone = CARD_TONE[importer.card];
  // A class with no stored name cannot be offered: the picker's label IS how
  // the operator identifies the destination, and an "Untitled" placeholder
  // would let them aim an import at a class they cannot tell apart.
  const classOptions = (classes.data?.data ?? [])
    .filter((klass): klass is typeof klass & { name: string } => typeof klass.name === 'string')
    .map((klass) => ({ value: klass.documentId, label: klass.name }));

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    void importer.onFile(event.dataTransfer.files?.[0]);
  };

  return (
    <section
      data-surface="ops-student-import"
      data-card={importer.card}
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4"
    >
      {hideHeader ? null : (
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-foreground">{t('title')}</h2>
          <p className="text-sm text-body">{t('description')}</p>
        </div>
      )}

      <SelectField
        id="ops-import-class"
        label={t('classLabel')}
        placeholder={t('classPlaceholder')}
        options={classOptions}
        value={importer.classDocumentId ?? undefined}
        onValueChange={(value) => importer.onClassChange(value)}
        helperText={t('classHelper')}
        required
      />

      <div
        data-surface="ops-import-dropzone"
        data-dragging={dragging || undefined}
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
        <Label htmlFor="ops-import-file" className="sr-only">
          {t('fileLabel')}
        </Label>
        <Input
          id="ops-import-file"
          type="file"
          accept=".csv,text/csv"
          className="max-w-72"
          onChange={(event) => void importer.onFile(event.target.files?.[0])}
        />
      </div>

      {tone === null ? null : (
        <Alert variant={tone} title={t(`card.${importer.card}.title`, { name: importer.fileName ?? '' })}>
          <div className="flex items-start justify-between gap-3">
            <span data-surface="ops-import-card-body">
              {t(`card.${importer.card}.body`, {
                created: importer.preview?.create.length ?? 0,
                skipped: importer.preview?.skip_existing.length ?? 0,
                rejected: importer.preview?.reject.length ?? 0,
              })}
            </span>
            {/* `:1702` `changeFile` — every card except `uploading` offers it. */}
            {importer.card === 'uploading' ? null : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-surface="ops-import-change-file"
                onClick={importer.changeFile}
              >
                {t('changeFileButton')}
              </Button>
            )}
          </div>
        </Alert>
      )}

      {importer.card === 'uploading' ? (
        <div data-surface="ops-import-progress" className="flex flex-col gap-1">
          {importer.progress === null ? (
            <p className="text-meta text-body">{t('progressPending')}</p>
          ) : (
            <>
              <ProgressBar value={importer.progress} ariaLabel={t('progressLabel')} />
              <p className="text-meta text-body">{t('progressPercent', { pct: importer.progress })}</p>
            </>
          )}
        </div>
      ) : null}

      {importer.unresolved ? (
        <Alert variant="warning" title={t('reconcileTitle')}>
          {t('reconcileBody')}
        </Alert>
      ) : null}

      <div
        data-surface="ops-import-template"
        className="flex items-start gap-3 rounded-xl bg-secondary px-4 py-3.5 text-sm leading-relaxed text-body"
      >
        <Info className="mt-0.5 size-4 flex-none text-primary" aria-hidden />
        <p>
          <span data-surface="ops-import-template-columns">
            {t('templateColumnsLabel')} {PORTAL_IMPORT_TEMPLATE_COLUMNS.join(', ')}.
          </span>{' '}
          <button
            type="button"
            data-surface="ops-import-template-download"
            disabled={template.downloading}
            onClick={() => void template.download()}
            className="font-semibold text-primary underline-offset-2 hover:underline disabled:opacity-60"
          >
            {t('templateDownloadLink')}
          </button>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {importer.card === 'uploading' ? (
          <Button
            type="button"
            variant="outline"
            loading={importer.cancelling}
            onClick={() => void importer.runCancel()}
          >
            {t('cancelButton')}
          </Button>
        ) : (
          // `:1690-1702` — one CTA, soft-disabled (opacity, still clickable) so
          // the four guards in `runCta` fire instead of the click being eaten
          // by a native `disabled` attribute.
          <Button
            type="button"
            data-surface="ops-import-cta"
            aria-disabled={importer.ctaDisabled || undefined}
            className={importer.ctaDisabled ? 'opacity-55' : undefined}
            loading={importer.previewing || importer.committing}
            onClick={() => void importer.runCta()}
          >
            {importer.ctaLabel}
          </Button>
        )}
        {importer.preview && importer.preview.reject.length > 0 ? (
          <Button type="button" variant="ghost" onClick={() => void importer.downloadErrorReport()}>
            {t('errorReportButton')}
          </Button>
        ) : null}
      </div>

      {importer.errorMessage ? (
        <Alert variant="error" title={t('errorToast')}>
          {importer.errorMessage}
        </Alert>
      ) : null}

      {importer.preview ? <OpsImportPreviewTables preview={importer.preview} /> : null}

      {importer.result ? (
        <div data-surface="ops-import-result" className="flex flex-wrap items-center gap-3">
          <p className="text-sm font-medium text-foreground">
            {t('resultSummary', {
              created: importer.result.created,
              skipped: importer.result.skipped,
              rejected: importer.result.rejected.length,
            })}
          </p>
          {importer.undoAvailable ? (
            <Button
              type="button"
              variant="outline"
              loading={importer.undoing}
              onClick={() => void importer.runUndo()}
            >
              {t('undoButton')}
            </Button>
          ) : (
            <p data-surface="ops-import-undo-reason" className="text-meta text-body">
              {importer.undoUnavailableReason}
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}
