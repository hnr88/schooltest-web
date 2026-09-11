'use client';

import { FileSearch } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/modules/design-system';
import { parentViewsEnabled } from '@/modules/flags';
import { QueryErrorFallback } from '@/modules/query-errors';
import { LegacyReportBody } from '@/modules/report/components/LegacyReportBody';
import { ParentReportView } from '@/modules/report/components/ParentReportView';
import { ReportSkeleton } from '@/modules/report/components/ReportSkeleton';
import { ReviewSubmissionLauncher } from '@/modules/report/components/ReviewSubmissionLauncher';
import { TeacherReportBody } from '@/modules/report/components/TeacherReportBody';
import { ViewToggle } from '@/modules/report/components/ViewToggle';
import { buildAttributePanel } from '@/modules/report/lib/attribute-view-model';
import { buildFamilyPreview } from '@/modules/report/lib/parent-view-model';
import { reportCrumbLabel } from '@/modules/report/lib/report-crumb';
import { useResultQuery } from '@/modules/results/queries/use-student-result.query';
import type { ReportViewMode } from '@/modules/report/types/report-view.types';
import { RecordCrumb } from '@/modules/shell';

// E11-01 — the teacher individual report: the route, the guard (mounted by the
// page) and the C-4 read, with E11-02..E11-09 rendered by `TeacherReportBody`.
// E11-10 adds the AUDIENCE: one route, one C-4 read, and a `view` mode that
// swaps the whole rendering. Parent mode builds its own allow-list view-model
// (E11-14) from the SAME cached result rather than hiding teacher blocks, so
// readiness, the CEFR band, the ACARA phase, the attribute codes and every
// posterior value are absent from the DOM, not merely invisible (E11-15).
export function TeacherReportScreen({ resultDocumentId }: { resultDocumentId: string }) {
  const t = useTranslations('Report');
  const format = useFormatter();
  const [view, setView] = useState<ReportViewMode>('teacher');
  const { data, error, isError, isFetching, isLoading, refetch } = useResultQuery(resultDocumentId);
  // Task 46 (st-mvp-pivot): the parent audience toggle is masked, not deleted,
  // while PARENT_VIEWS_ENABLED is off — the report stays in teacher mode and
  // the toggle leaves the DOM until the flag flips on.
  const parentViews = parentViewsEnabled();

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

  // Legacy-r7 rows (and any other non-v2 view) never reach the view-models:
  // they render their stored statements as text via `LegacyReportBody`. With no
  // stored label the trail ends at Reports — a raw documentId is never a crumb.
  if (data.kind === 'legacy') {
    const legacyCrumb = data.view.display_label ?? data.view.acara_phase;
    return (
      <main
        data-surface="teacher-report"
        className="flex flex-1 animate-in flex-col gap-6 px-4 py-6 duration-300 ease-out-expo slide-in-from-bottom-2 motion-reduce:animate-none sm:px-6 lg:px-8 lg:py-7"
      >
        {legacyCrumb ? <RecordCrumb label={legacyCrumb} /> : null}
        <ReviewSubmissionLauncher resultDocumentId={resultDocumentId} view={data.view} />
        <LegacyReportBody view={data.view} />
      </main>
    );
  }

  const result = data.view;
  const attributes = buildAttributePanel(result);
  const evidence = attributes.state === 'rows' ? attributes.evidence : null;
  const parent = buildFamilyPreview(result);
  const teacherCrumb = reportCrumbLabel(
    result,
    (skill) => t(`skills.${skill}`),
    (iso) => format.dateTime(new Date(iso), { dateStyle: 'medium' }),
  );
  const parentCrumb = parent.phase.label ?? t('parentHeadlinePending');

  return (
    <main
      data-surface="teacher-report"
      data-view={view}
      className="flex flex-1 animate-in flex-col gap-6 px-4 py-6 duration-300 ease-out-expo slide-in-from-bottom-2 motion-reduce:animate-none sm:px-6 lg:px-8 lg:py-7"
    >
      <RecordCrumb label={parentViews && view === 'parent' ? parentCrumb : teacherCrumb} />

      <ReviewSubmissionLauncher resultDocumentId={resultDocumentId} view={result} />

      {parentViews && <ViewToggle value={view} onChange={setView} />}

      {parentViews && view === 'parent' ? (
        <ParentReportView view={parent} />
      ) : (
        <TeacherReportBody result={result} attributes={attributes} evidence={evidence} />
      )}
    </main>
  );
}
