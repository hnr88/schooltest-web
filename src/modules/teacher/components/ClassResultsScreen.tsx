'use client';

import { LineChart } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Skeleton } from '@/components/ui/skeleton';
import { Alert, Button } from '@/modules/design-system';
import { useRecordCrumb } from '@/modules/shell';
import { ClassResultsHeader } from '@/modules/teacher/components/ClassResultsHeader';
import { ClassResultsTabs } from '@/modules/teacher/components/ClassResultsTabs';
import { ResultsTabPending } from '@/modules/teacher/components/ResultsTabPending';
import { StudentsTabPanel } from '@/modules/teacher/components/StudentsTabPanel';
import { TeachingInsightsPanel } from '@/modules/teacher/components/TeachingInsightsPanel';
import { deriveResultsStatus } from '@/modules/teacher/lib/results-shell';
import { useClassStudentsQuery } from '@/modules/teacher/queries/use-class-students.query';
import type { ClassResultsScreenProps } from '@/modules/teacher/types/results-shell.types';

// /dashboard/results/<classDocumentId> — the class detail behind the Results
// class list. ONE live read of C-TR-1 feeds the header; the class name is
// published to the app's single breadcrumb through the shell's useRecordCrumb, so
// the trail reads "Dashboard / Results / EAL/D 8A" (.qa/DESIGN.md).
//
// A failed read renders the error branch and NOTHING else — there is no cached
// class name, no "0 / 0" stand-in and no empty-looking header standing in for a
// 403 or a 404.
function ClassResultsScreen({ classDocumentId }: ClassResultsScreenProps) {
  const t = useTranslations('Teacher.results.detail');
  const tabs = useTranslations('Teacher.results.pending');
  const classResults = useClassStudentsQuery(classDocumentId);
  const data = classResults.data;
  const status = deriveResultsStatus({
    isLoading: classResults.isPending,
    isError: classResults.isError,
    isSuccess: classResults.isSuccess,
    itemCount: data ? 1 : 0,
  });

  useRecordCrumb(data?.class.name);

  return (
    <main
      data-surface="teacher-class-results"
      data-status={status}
      data-class-id={classDocumentId}
      className="flex flex-1 animate-in flex-col gap-6 px-4 py-6 duration-300 ease-out-expo slide-in-from-bottom-2 motion-reduce:animate-none sm:px-6 lg:px-8 lg:py-7"
    >
      {status === 'loading' ? (
        <div role="status" aria-label={t('loading')} className="flex flex-col gap-4">
          <Skeleton className="h-8 w-2/5" />
          <Skeleton className="h-24 w-full rounded-card" />
          <Skeleton className="h-64 w-full rounded-card" />
        </div>
      ) : null}

      {status === 'error' || status === 'empty' ? (
        <Alert
          variant="error"
          title={t('errorTitle')}
          action={
            <Button
              variant="outline"
              size="sm"
              loading={classResults.isFetching}
              onClick={() => classResults.refetch()}
            >
              {t('retry')}
            </Button>
          }
        >
          {t('errorDescription')}
        </Alert>
      ) : null}

      {status === 'ready' && data ? (
        <>
          <ClassResultsHeader
            className={data.class.name}
            studentCount={data.class.student_count}
            summary={data.summary}
          />
          <ClassResultsTabs
            students={
              <StudentsTabPanel classDocumentId={classDocumentId} students={data.students} />
            }
            insights={<TeachingInsightsPanel classDocumentId={classDocumentId} />}
            progress={
              <ResultsTabPending
                slot="progress"
                icon={LineChart}
                title={tabs('progressTitle')}
                description={tabs('progressDescription')}
              />
            }
          />
        </>
      ) : null}
    </main>
  );
}

export { ClassResultsScreen };
