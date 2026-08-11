'use client';

import { useTranslations } from 'next-intl';

import { Skeleton } from '@/components/ui/skeleton';
import { Alert, Button } from '@/modules/design-system';
import { useRecordCrumb } from '@/modules/shell';
import { ClassResultsHeader } from '@/modules/teacher/components/ClassResultsHeader';
import { ClassResultsTabs } from '@/modules/teacher/components/ClassResultsTabs';
import { ProgressTabPanel } from '@/modules/teacher/components/ProgressTabPanel';
import { StudentsTabPanel } from '@/modules/teacher/components/StudentsTabPanel';
import { TeachingInsightsPanel } from '@/modules/teacher/components/TeachingInsightsPanel';
import { TEACHER_RETRY_BUTTON_CLASS } from '@/modules/teacher/constants/a11y.constants';
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
//
// Each tab owns its own live read: Students from this C-TR-1 body, Teaching
// insights from C-TR-3, Progress from C-TR-4 (task 045).
function ClassResultsScreen({ classDocumentId }: ClassResultsScreenProps) {
  const t = useTranslations('Teacher.results.detail');
  const tSection = useTranslations('Teacher.results');
  const classResults = useClassStudentsQuery(classDocumentId);
  const data = classResults.data;
  const status = deriveResultsStatus({
    isLoading: classResults.isPending,
    isError: classResults.isError,
    isSuccess: classResults.isSuccess,
    itemCount: data ? 1 : 0,
  });

  useRecordCrumb(data?.class.name);

  // A `<div>`, not a second `<main>`: the READ-ONLY `SidebarInset` primitive
  // (src/components/ui/sidebar.tsx) already renders this route's `<main>`, and a
  // screen-level `<main>` nested inside it made axe report
  // landmark-no-duplicate-main + landmark-main-is-top-level + landmark-unique on
  // every frame of this page (task 047, measured at 1280px and 375px). The
  // landmark above still contains all of this content, so nothing leaves a
  // landmark; `data-surface`/`data-status` stay where every spec reads them.
  return (
    <div
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

      {/*
        The failed read has no class name, so the READY branch's h1 cannot render —
        and axe measured `page-has-heading-one` on this exact frame (task 047). The
        route's own section name is the honest level-one heading here: the page IS
        Results, only this class could not be read.
      */}
      {status === 'error' || status === 'empty' ? (
        <h1 className="text-portal-title font-bold text-foreground">{tSection('title')}</h1>
      ) : null}

      {status === 'error' || status === 'empty' ? (
        <Alert
          variant="error"
          title={t('errorTitle')}
          action={
            <Button
              variant="outline"
              size="sm"
              className={TEACHER_RETRY_BUTTON_CLASS}
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
            progress={<ProgressTabPanel classDocumentId={classDocumentId} />}
          />
        </>
      ) : null}
    </div>
  );
}

export { ClassResultsScreen };
