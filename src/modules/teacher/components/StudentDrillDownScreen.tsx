'use client';

import { ClipboardList } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Skeleton } from '@/components/ui/skeleton';
import { Alert, Button, EmptyState } from '@/modules/design-system';
import { useRecordCrumb } from '@/modules/shell';
import { StudentDrillDownBody } from '@/modules/teacher/components/StudentDrillDownBody';
import { StudentDrillDownHeader } from '@/modules/teacher/components/StudentDrillDownHeader';
import { deriveResultsStatus } from '@/modules/teacher/lib/results-shell';
import { useStudentDrillDownQuery } from '@/modules/teacher/queries/use-student-drill-down.query';
import type { StudentDrillDownScreenProps } from '@/modules/teacher/types/student-drill-down.types';

// /dashboard/results/<classDocumentId>/students/<studentDocumentId> — the
// drill-down behind every row of the Students tab. ONE live read of C-TR-2 feeds
// the whole page; the student's name is published to the app's single breadcrumb.
//
// `tests` arrives MOST RECENT FIRST and is rendered in that order, unreordered.
// An EMPTY array is the server's own "no completed test yet" (the roster row
// exists, no result does) — never a swallowed failure: a failed read renders the
// error branch and nothing else, with no zeroed tiles and no grey grid standing in
// for a 403 or a 404. The comparison strip, the older test's collapse and the
// per-tile deltas live in `StudentDrillDownBody` (task 043); the C-TR-7 "Export for
// AI" button lives in the header, which is why the class id is threaded to it.
function StudentDrillDownScreen({
  classDocumentId,
  studentDocumentId,
}: StudentDrillDownScreenProps) {
  const t = useTranslations('Teacher.results.drillDown');
  const drillDown = useStudentDrillDownQuery(classDocumentId, studentDocumentId);
  const data = drillDown.data;
  const status = deriveResultsStatus({
    isLoading: drillDown.isPending,
    isError: drillDown.isError,
    isSuccess: drillDown.isSuccess,
    itemCount: data?.tests.length ?? 0,
  });

  useRecordCrumb(data?.student.display_name);

  return (
    <main
      data-surface="teacher-student-drill-down"
      data-status={status}
      data-class-id={classDocumentId}
      data-student-id={studentDocumentId}
      className="flex flex-1 animate-in flex-col gap-6 px-4 py-6 duration-300 ease-out-expo slide-in-from-bottom-2 motion-reduce:animate-none sm:px-6 lg:px-8 lg:py-7"
    >
      {status === 'loading' ? (
        <div role="status" aria-label={t('loading')} className="flex flex-col gap-4">
          <Skeleton className="h-13 w-2/5" />
          <Skeleton className="h-72 w-full rounded-card" />
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
              loading={drillDown.isFetching}
              onClick={() => drillDown.refetch()}
            >
              {t('retry')}
            </Button>
          }
        >
          {t('errorDescription')}
        </Alert>
      ) : null}

      {data ? (
        <>
          <StudentDrillDownHeader student={data.student} classDocumentId={classDocumentId} />
          {status === 'empty' ? (
            <EmptyState
              icon={ClipboardList}
              tone="brand"
              title={t('emptyTitle')}
              description={t('emptyDescription')}
            />
          ) : (
            <StudentDrillDownBody data={data} />
          )}
        </>
      ) : null}
    </main>
  );
}

export { StudentDrillDownScreen };
