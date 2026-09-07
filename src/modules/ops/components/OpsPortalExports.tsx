'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Download } from 'lucide-react';

import { useAuthStore } from '@/modules/auth';
import { Alert, Button } from '@/modules/design-system';
import {
  parseSchoolsExportScope,
  schoolsExportHasFilters,
  withSelection,
} from '@/modules/ops/lib/schools-export.lib';
import { useSchoolsExportQuery } from '@/modules/ops/queries/use-schools-export.query';
import type { OpsPortalExportsProps } from '@/modules/ops/types/schools-export.types';
import { saveCsvDownload } from '@/modules/school-admin';

/**
 * C-OPS-PORTAL-009 (OPS-019) — the schools directory export action.
 *
 * The button downloads EXACTLY the scope named beside it: the ticked rows when
 * a selection exists, otherwise the filters currently in the URL, otherwise
 * every school. The scope line is rendered from the same object the request is
 * built from, so the operator can never be shown one scope and handed another.
 * The server picks the filename (Content-Disposition); a failed export writes
 * no file at all — the error is JSON and lands in the alert below.
 */
export function OpsPortalExports({ selectedDocumentIds }: OpsPortalExportsProps) {
  const t = useTranslations('Ops.export');
  const searchParams = useSearchParams();
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const [failed, setFailed] = useState(false);
  const [downloaded, setDownloaded] = useState<string | null>(null);

  const scope = useMemo(
    () => withSelection(parseSchoolsExportScope(new URLSearchParams(searchParams)), selectedDocumentIds),
    [searchParams, selectedDocumentIds],
  );
  const exportQuery = useSchoolsExportQuery(scope);

  const selectedCount = scope.documentIds?.length ?? 0;
  const kind = selectedCount > 0 ? 'selected' : schoolsExportHasFilters(scope) ? 'filtered' : 'all';
  const summary =
    kind === 'selected'
      ? t('scopeSelected', { count: selectedCount })
      : kind === 'filtered'
        ? t('scopeFiltered')
        : t('scopeAll');

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
      data-slot="ops-schools-export"
      data-surface="ops-schools-export"
      aria-label={t('title')}
      className="flex flex-col gap-2 rounded-card border border-border bg-card px-4 py-3 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p
          data-slot="ops-schools-export-scope"
          data-scope={kind}
          data-selected-count={selectedCount}
          className="text-sm text-body"
        >
          {summary}
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!hydrated || !token}
          loading={exportQuery.isFetching}
          onClick={handleExport}
        >
          <Download aria-hidden="true" className="size-4" />
          {exportQuery.isFetching ? t('downloading') : t('cta')}
        </Button>
      </div>
      {downloaded !== null ? (
        <p
          data-slot="ops-schools-export-done"
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
