'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/modules/design-system';
import { saveCsvDownload } from '@/modules/school-admin/lib/save-csv-download';
import { useResultsExportQuery } from '@/modules/school-admin/queries/use-results-export.query';

// C-RPT-05 export affordance (task 78, mvp spec 4.3): downloads the
// school-level results CSV for sharing upward (exec, head of department).
// The lazy query fetches on click only; this component holds just the
// pending/error UI state.
export function ResultsExportButton() {
  const t = useTranslations('SchoolAdmin.analytics.export');
  const query = useResultsExportQuery();
  const [failed, setFailed] = useState(false);

  async function handleExport() {
    setFailed(false);
    const result = await query.refetch();
    if (result.data) {
      saveCsvDownload(result.data);
    } else {
      setFailed(true);
    }
  }

  return (
    <div data-slot="results-export" className="flex flex-col gap-1">
      <Button variant="outline" loading={query.isFetching} onClick={handleExport}>
        {query.isFetching ? t('downloading') : t('cta')}
      </Button>
      {failed ? (
        <p role="alert" className="text-sm text-danger-ink">
          {t('error')}
        </p>
      ) : null}
    </div>
  );
}
