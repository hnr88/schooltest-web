'use client';

import { FileSearch } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/modules/design-system';
import { QueryErrorFallback } from '@/modules/query-errors';
import { ParentReportView } from '@/modules/report/components/ParentReportView';
import { ReportSkeleton } from '@/modules/report/components/ReportSkeleton';
import { TeacherReportBody } from '@/modules/report/components/TeacherReportBody';
import { ViewToggle } from '@/modules/report/components/ViewToggle';
import { buildAttributePanel } from '@/modules/report/lib/attribute-view-model';
import { resolveDisplayLabel } from '@/modules/report/lib/display-label';
import { buildParentReport } from '@/modules/report/lib/parent-view-model';
import { useResultQuery } from '@/modules/report/queries/use-result.query';
import type { ReportViewMode } from '@/modules/report/types/report-view.types';
import { RecordCrumb } from '@/modules/shell';

// E11-01 — the teacher individual report: the route, the guard (mounted by the
// page) and the C-4 read, with E11-02..E11-09 rendered by `TeacherReportBody`.
// E11-10 adds the AUDIENCE: one route, one C-4 read, and a `view` mode that
// swaps the whole rendering. Parent mode builds its own allow-list view-model
// (E11-14) from the SAME cached result rather than hiding teacher blocks, so
// readiness, the CEFR band, the ACARA phase, the attribute codes and every
// probability are absent from the DOM, not merely invisible (E11-15).
export function TeacherReportScreen({ resultDocumentId }: { resultDocumentId: string }) {
  const t = useTranslations('Report');
  const [view, setView] = useState<ReportViewMode>('teacher');
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

  const displayLabel = resolveDisplayLabel(data);
  const attributes = buildAttributePanel(data);
  const evidence = attributes.state === 'rows' ? attributes.evidence : null;
  const parent = buildParentReport(data);
  const teacherCrumb =
    displayLabel.state === 'derived' ? displayLabel.label : t(displayLabel.absentKey);
  const parentCrumb =
    parent.headline.state === 'derived'
      ? parent.headline.label
      : t(
          parent.headline.state === 'pending'
            ? 'parentHeadlinePending'
            : 'parentHeadlineNotApplicable',
        );

  return (
    <main
      data-surface="teacher-report"
      data-view={view}
      className="flex flex-1 animate-in flex-col gap-6 px-4 py-6 duration-300 ease-out-expo slide-in-from-bottom-2 motion-reduce:animate-none sm:px-6 lg:px-8 lg:py-7"
    >
      <RecordCrumb label={view === 'parent' ? parentCrumb : teacherCrumb} />

      <ViewToggle value={view} onChange={setView} />

      {view === 'parent' ? (
        <ParentReportView view={parent} />
      ) : (
        <TeacherReportBody result={data} attributes={attributes} evidence={evidence} />
      )}
    </main>
  );
}
