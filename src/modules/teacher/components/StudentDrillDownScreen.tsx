'use client';

import { ClipboardList } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Skeleton } from '@/components/ui/skeleton';
import { Alert, Button, EmptyState } from '@/modules/design-system';
import { useRecordCrumb } from '@/modules/shell';
import { StudentDrillDownBody } from '@/modules/teacher/components/StudentDrillDownBody';
import { StudentDrillDownHeader } from '@/modules/teacher/components/StudentDrillDownHeader';
import { TEACHER_RETRY_BUTTON_CLASS } from '@/modules/teacher/constants/a11y.constants';
import { useStudentDrillDownQuery } from '@/modules/teacher/queries/use-student-drill-down.query';
import type { StudentDrillDownScreenProps } from '@/modules/teacher/types/student-drill-down.types';

// /dashboard/results/<classDocumentId>/students/<studentDocumentId> — the
// drill-down behind every row of the Students tab, served by the CANONICAL
// reads (web repoint, pre-24): the class roster names the student and carries
// their latest result reference, and ONE `GET /results/{id}` returns the v2
// view with `history`. The retired C-TR-2 read is gone from this page.
//
// States are the shared hooks': pending -> skeleton, error -> retryable alert
// (a failed read renders the error branch and nothing else — no zeroed tiles
// and no grey grid standing in for a 403 or a 404), empty -> the server's own
// "no completed test yet" for a roster student without an official Result.
function StudentDrillDownScreen({
  classDocumentId,
  studentDocumentId,
}: StudentDrillDownScreenProps) {
  const t = useTranslations('Teacher.results.drillDown');
  const tSection = useTranslations('Teacher.results');
  const drillDown = useStudentDrillDownQuery(classDocumentId, studentDocumentId);

  useRecordCrumb(
    drillDown.status === 'success' ? drillDown.data.displayName : null,
    drillDown.status === 'success'
      ? { [`/dashboard/results/${classDocumentId}`]: classDocumentId }
      : undefined,
  );

  return (
    <div
      data-surface="teacher-student-drill-down"
      data-status={drillDown.status}
      data-class-id={classDocumentId}
      data-student-id={studentDocumentId}
      className="flex flex-1 animate-in flex-col gap-6 px-4 py-6 duration-300 ease-out-expo slide-in-from-bottom-2 motion-reduce:animate-none sm:px-6 lg:px-8 lg:py-7"
    >
      {drillDown.status === 'pending' ? (
        <div role="status" aria-label={t('loading')} className="flex flex-col gap-4">
          <Skeleton className="h-13 w-2/5" />
          <Skeleton className="h-72 w-full rounded-card" />
        </div>
      ) : null}

      {/*
        A failed read has no student name, so the header's h1 cannot render —
        axe measured `page-has-heading-one` on that frame (task 047). The
        route's section name is the honest level-one heading in its place.
      */}
      {drillDown.status === 'error' ? (
        <h1 className="text-portal-title font-bold text-foreground">{tSection('title')}</h1>
      ) : null}

      {drillDown.status === 'error' ? (
        <Alert
          variant="error"
          title={t('errorTitle')}
          action={
            <Button
              variant="outline"
              size="sm"
              className={TEACHER_RETRY_BUTTON_CLASS}
              onClick={() => drillDown.refetch()}
            >
              {t('retry')}
            </Button>
          }
        >
          {t('errorDescription')}
        </Alert>
      ) : null}

      {drillDown.status === 'empty' ? (
        <EmptyState
          icon={ClipboardList}
          tone="brand"
          title={t('emptyTitle')}
          description={t('emptyDescription')}
        />
      ) : null}

      {drillDown.status === 'success' ? (
        <>
          <StudentDrillDownHeader
            studentDocumentId={drillDown.data.studentDocumentId}
            displayName={drillDown.data.displayName}
            classDocumentId={classDocumentId}
          />
          <StudentDrillDownBody view={drillDown.data.view} />
        </>
      ) : null}
    </div>
  );
}

export { StudentDrillDownScreen };
