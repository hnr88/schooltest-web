'use client';

import { FileChartColumn } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { EmptyState, PanelHeaderRow, SkeletonCard } from '@/modules/design-system';
import { QueryErrorFallback } from '@/modules/query-errors';
import { ReportListRow } from '@/modules/report/components/ReportListRow';
import { useMyStudentResultsQuery } from '@/modules/report/queries/use-my-student-results.query';

// E11-01 — the entry point into the teacher report: the C-11 list of this
// teacher's own students' OFFICIAL results, exactly as the API scopes it.
export function ReportListScreen() {
  const t = useTranslations('Report');
  const { data, error, isError, isFetching, isLoading, refetch } = useMyStudentResultsQuery();

  return (
    <main
      data-surface="teacher-report-list"
      className="flex flex-1 animate-in flex-col gap-6 px-4 py-6 duration-300 ease-out-expo slide-in-from-bottom-2 motion-reduce:animate-none sm:px-6 lg:px-8 lg:py-7"
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-portal-title font-bold text-foreground">{t('listTitle')}</h1>
        <p className="text-lede text-muted-foreground">{t('listDescription')}</p>
      </div>

      {isLoading ? (
        <SkeletonCard rows={5} />
      ) : isError || !data ? (
        <div className="w-full max-w-160">
          <QueryErrorFallback
            error={error}
            action={null}
            isRetrying={isFetching}
            onRetry={() => refetch()}
            goneIcon={FileChartColumn}
            goneTitle={t('listGoneTitle')}
            goneDescription={t('listGoneDescription')}
          />
        </div>
      ) : (
        <section
          data-slot="report-list-panel"
          aria-labelledby="report-list-title"
          className="flex flex-col gap-1 rounded-card bg-card px-6 py-6 shadow-sm sm:px-7.5"
        >
          <PanelHeaderRow
            as="h2"
            titleId="report-list-title"
            title={t('listPanelHeading')}
            description={t('listPanelDescription', { count: data.length })}
            className="items-center pb-1 [&_h2]:text-portal-panel"
          />
          {data.length === 0 ? (
            <EmptyState
              icon={FileChartColumn}
              tone="brand"
              title={t('listEmptyTitle')}
              description={t('listEmptyDescription')}
              className="border-none px-0 py-2"
            />
          ) : (
            <ul className="flex flex-col">
              {data.map((result) => (
                <ReportListRow key={result.document_id} result={result} />
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}
