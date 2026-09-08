'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Download } from 'lucide-react';

import { useAuthStore } from '@/modules/auth';
import { Alert, Button, FieldShell } from '@/modules/design-system';
import { Input } from '@/components/ui/input';
import { useResponsesCsvQuery } from '@/modules/ops/queries/use-responses-csv.query';
import { saveCsvDownload } from '@/modules/school-admin';

/**
 * Ledger row 11b / D-007 — the raw item-level responses.csv export, mounted
 * beside the schools export on the ops schools page (its sibling
 * `OpsPortalExports` is the exemplar this follows).
 *
 * ONE session at a time, by design: the server requires
 * `session_documentId` and 400s without it, because this export is the
 * item-level table for offline R work and there is no whole-table form of it.
 * The operator pastes the session id they are investigating (the live monitor
 * and the recovery table are where they get it) and the file is pulled on
 * click — never on render.
 *
 * The server names the file (`Content-Disposition`), the download reuses the
 * shared `saveCsvDownload` Blob helper, and a refused export writes NO file:
 * the error body is JSON and lands in the alert below.
 */
export function OpsResponsesExport() {
  const t = useTranslations('Ops.responsesExport');
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const [sessionDocumentId, setSessionDocumentId] = useState('');
  const [failed, setFailed] = useState(false);
  const [downloaded, setDownloaded] = useState<string | null>(null);
  const trimmed = sessionDocumentId.trim();
  const exportQuery = useResponsesCsvQuery(trimmed);

  async function handleExport() {
    setFailed(false);
    setDownloaded(null);
    const result = await exportQuery.refetch();
    if (result.data) {
      saveCsvDownload(result.data.csv, result.data.filename);
      setDownloaded(result.data.filename);
      return;
    }
    setFailed(true);
  }

  return (
    <section
      data-slot="ops-responses-export"
      data-surface="ops-responses-export"
      aria-label={t('title')}
      className="flex flex-col gap-2 rounded-card border border-border bg-card px-4 py-3 shadow-sm"
    >
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-foreground">{t('title')}</p>
        <p className="text-sm text-body">{t('description')}</p>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <FieldShell
          id="ops-responses-export-session"
          label={t('sessionLabel')}
          className="min-w-64 flex-1"
        >
          <Input
            id="ops-responses-export-session"
            data-slot="ops-responses-export-input"
            value={sessionDocumentId}
            placeholder={t('sessionPlaceholder')}
            onChange={(event) => setSessionDocumentId(event.target.value)}
          />
        </FieldShell>
        <Button
          type="button"
          size="sm"
          variant="outline"
          data-slot="ops-responses-export-cta"
          disabled={!hydrated || !token || trimmed === ''}
          loading={exportQuery.isFetching}
          onClick={handleExport}
        >
          <Download aria-hidden="true" className="size-4" />
          {exportQuery.isFetching ? t('downloading') : t('cta')}
        </Button>
      </div>
      {downloaded !== null ? (
        <p
          data-slot="ops-responses-export-done"
          data-filename={downloaded}
          role="status"
          className="text-sm text-body"
        >
          {t('downloaded', { filename: downloaded })}
        </p>
      ) : null}
      {failed ? (
        <Alert variant="error" title={t('errorTitle')}>
          {t('errorDescription')}
        </Alert>
      ) : null}
    </section>
  );
}
