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
import { useTeacherDashboardQuery } from '@/modules/teacher/queries/use-teacher-dashboard.query';
import { useClassResultsQuery } from '@/modules/results/queries/use-class-results.query';
import type { ClassResultsScreenProps } from '@/modules/teacher/types/results-shell.types';

// /dashboard/results/<classDocumentId> — the class detail behind the Results
// class list. ONE roster read (spec v2 §6.3, task 33) feeds EVERYTHING here:
// the header tiles, the Students tab and both Screen B tabs — no per-tab reads
// (the retired C-TR-1/3/4 hooks lost their callers in tasks 33/34, which is
// what unblocks the api-side route retirement, task 24).
//
// The CLASS NAME is not on the roster payload (no PII beyond the student block),
// so it comes from the teacher's dashboard read (C-TD-1) — the SAME cached read
// the Results list page already made, shared by react-query's key. Switching
// tabs never re-issues anything; arriving here from the list re-issues nothing.
// On a hard refresh the name may still be arriving when the roster is ready —
// the h1 falls back to the section name until it lands, never to a guess.
//
// A failed roster read renders the error branch and NOTHING else — no cached
// tiles, no "0 / 0" stand-in and no empty-looking header standing in for a 403.
function ClassResultsScreen({ classDocumentId }: ClassResultsScreenProps) {
  const t = useTranslations('Teacher.results.detail');
  const tSection = useTranslations('Teacher.results');
  const roster = useClassResultsQuery(classDocumentId);
  const dashboard = useTeacherDashboardQuery();
  const classCard = dashboard.data?.classes.find((entry) => entry.class_document_id === classDocumentId);
  const rows = roster.data ?? [];
  const status = deriveResultsStatus({
    isLoading: roster.isPending,
    isError: roster.isError,
    isSuccess: roster.isSuccess,
    itemCount: rows.length,
  });

  useRecordCrumb(classCard?.name);

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
        <h1 className="text-portal-title font-bold text-foreground">
          {classCard?.name ?? tSection('title')}
        </h1>
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
              loading={roster.isFetching}
              onClick={() => roster.refetch()}
            >
              {t('retry')}
            </Button>
          }
        >
          {t('errorDescription')}
        </Alert>
      ) : null}

      {status === 'ready' ? (
        <>
          <ClassResultsHeader className={classCard?.name ?? tSection('title')} rows={rows} />
          <ClassResultsTabs
            students={
              <StudentsTabPanel classDocumentId={classDocumentId} rows={rows} />
            }
            insights={<TeachingInsightsPanel classDocumentId={classDocumentId} rows={rows} />}
            progress={<ProgressTabPanel classDocumentId={classDocumentId} rows={rows} />}
          />
        </>
      ) : null}
    </div>
  );
}

export { ClassResultsScreen };
