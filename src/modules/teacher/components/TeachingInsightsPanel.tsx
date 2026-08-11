'use client';

import { BarChart3 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Skeleton } from '@/components/ui/skeleton';
import { Alert, Button, EmptyState } from '@/modules/design-system';
import { SubskillMasteryList } from '@/modules/teacher/components/SubskillMasteryList';
import { SuggestedGroupsSection } from '@/modules/teacher/components/SuggestedGroupsSection';
import { TeacherExportPanel } from '@/modules/teacher/components/TeacherExportPanel';
import { deriveResultsStatus } from '@/modules/teacher/lib/results-shell';
import { useClassInsightsQuery } from '@/modules/teacher/queries/use-class-insights.query';
import type { TeachingInsightsPanelProps } from '@/modules/teacher/types/teaching-insights.types';

// The Teaching insights tab: ONE live read of C-TR-3 feeding the mastery bars, the
// suggested groups and the AI export panel (.qa/DESIGN.md §Teaching insights 1-3).
//
// The export panel rides the READY branch only: C-TR-5 builds its document from the
// same completed results these bars are drawn from, so offering the download while
// the class has none — or while the read failed — would promise a file the server
// would refuse.
//
// `empty` is C-TR-3's own `completed_count === 0` — an emptiness the server
// asserted, never a swallowed failure: a failed read renders the error branch and
// NOTHING else, with no zeroed bars and no "no gaps" card standing in for a 403.
function TeachingInsightsPanel({ classDocumentId }: TeachingInsightsPanelProps) {
  const t = useTranslations('Teacher.results.insights');
  const tExport = useTranslations('Teacher.results.export');
  const insights = useClassInsightsQuery(classDocumentId);
  const data = insights.data;
  const status = deriveResultsStatus({
    isLoading: insights.isPending,
    isError: insights.isError,
    isSuccess: insights.isSuccess,
    itemCount: data?.completed_count ?? 0,
  });

  return (
    <div data-slot="teaching-insights" data-status={status} className="flex flex-col gap-6">
      {status === 'loading' ? (
        <div role="status" aria-label={t('loading')} className="flex flex-col gap-4">
          <Skeleton className="h-56 w-full rounded-card" />
          <Skeleton className="h-40 w-full rounded-card" />
        </div>
      ) : null}

      {status === 'error' ? (
        <Alert
          variant="error"
          title={t('errorTitle')}
          action={
            <Button
              variant="outline"
              size="sm"
              loading={insights.isFetching}
              onClick={() => insights.refetch()}
            >
              {t('retry')}
            </Button>
          }
        >
          {t('errorDescription')}
        </Alert>
      ) : null}

      {status === 'empty' ? (
        <EmptyState
          icon={BarChart3}
          tone="brand"
          title={t('emptyTitle')}
          description={t('emptyDescription')}
        />
      ) : null}

      {status === 'ready' && data ? (
        <>
          <SubskillMasteryList mastery={data.mastery} completedCount={data.completed_count} />
          <SuggestedGroupsSection groups={data.groups} />
          <TeacherExportPanel
            request={{ kind: 'insights', classDocumentId }}
            headingId="teaching-insights-export-heading"
            title={tExport('insightsTitle')}
            description={tExport('insightsDescription')}
            buttonLabel={tExport('insightsButton')}
            footnote={tExport('insightsFootnote')}
          />
        </>
      ) : null}
    </div>
  );
}

export { TeachingInsightsPanel };
