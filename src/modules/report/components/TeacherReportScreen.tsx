'use client';

import { FileSearch } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/modules/design-system';
import { QueryErrorFallback } from '@/modules/query-errors';
import { DisplayLabelPanel } from '@/modules/report/components/DisplayLabelPanel';
import { ReportSkeleton } from '@/modules/report/components/ReportSkeleton';
import { useResultQuery } from '@/modules/report/queries/use-result.query';
import { RecordCrumb } from '@/modules/shell';

// E11-01 — the teacher individual report. This slice owns the route, the guard
// (mounted by the page) and the C-4 read; the header facts (ACARA phase, CEFR
// band), the attribute bars, the supplementary strand and the observations are
// separate backlog rows, so they are absent here rather than filled in blind.
export function TeacherReportScreen({ resultDocumentId }: { resultDocumentId: string }) {
  const t = useTranslations('Report');
  const { data, error, isError, isFetching, isLoading, refetch } = useResultQuery(resultDocumentId);

  if (isLoading) return <ReportSkeleton />;

  if (isError || !data) {
    return (
      <main className="flex flex-1 flex-col px-4 py-7 sm:px-6 lg:px-8">
        <div className="w-full max-w-160">
          <QueryErrorFallback
            error={error}
            goneIcon={FileSearch}
            goneTitle={t('reportGoneTitle')}
            goneDescription={t('reportGoneDescription')}
            isRetrying={isFetching}
            onRetry={() => refetch()}
            action={
              <Button
                href="/dashboard/reports"
                variant="outline"
                size="sm"
                className="h-11 rounded-full px-4"
              >
                {t('backToList')}
              </Button>
            }
          />
        </div>
      </main>
    );
  }

  return (
    <main
      data-surface="teacher-report"
      className="flex flex-1 animate-in flex-col gap-6 px-4 py-6 duration-300 ease-out-expo slide-in-from-bottom-2 motion-reduce:animate-none sm:px-6 lg:px-8 lg:py-7"
    >
      <RecordCrumb label={data.display_label ?? t('displayLabelPending')} />
      <DisplayLabelPanel result={data} />
    </main>
  );
}
