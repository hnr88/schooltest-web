'use client';

import { Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Skeleton } from '@/components/ui/skeleton';
import { Alert, Button, EmptyState } from '@/modules/design-system';
import { ResultsClassRow } from '@/modules/teacher/components/ResultsClassRow';
import { TEACHER_RETRY_BUTTON_CLASS } from '@/modules/teacher/constants/a11y.constants';
import { deriveResultsStatus } from '@/modules/teacher/lib/results-shell';
import { useTeacherDashboardQuery } from '@/modules/teacher/queries/use-teacher-dashboard.query';

// /dashboard/results — the Results entry point: the list of classes the teacher
// owns, each linking to that class's four-tab detail. The classes come from ONE
// live read of C-TD-1 (`GET /api/teacher/dashboard`), the same read the teacher
// Dashboard uses, so the two surfaces can never disagree about the roster or the
// completion counts.
//
// There is no seeded class, no placeholder row and no "0 / 0" stand-in: a failed
// read renders the error branch, and an empty `classes` array is believed only
// once the read has actually succeeded.
function ResultsScreen() {
  const t = useTranslations('Teacher.results');
  const dashboard = useTeacherDashboardQuery();
  const classes = dashboard.data?.classes ?? [];
  const status = deriveResultsStatus({
    isLoading: dashboard.isPending,
    isError: dashboard.isError,
    isSuccess: dashboard.isSuccess,
    itemCount: classes.length,
  });

  // A `<div>`, not a second `<main>`: the READ-ONLY `SidebarInset` primitive
  // (src/components/ui/sidebar.tsx) already renders this route's `<main>`, and a
  // screen-level `<main>` nested inside it made axe report
  // landmark-no-duplicate-main + landmark-main-is-top-level + landmark-unique on
  // every frame of this page (task 047, measured at 1280px and 375px). The
  // landmark above still contains all of this content, so nothing leaves a
  // landmark; `data-surface`/`data-status` stay where every spec reads them.
  return (
    <div
      data-surface="teacher-results"
      data-status={status}
      className="flex flex-1 animate-in flex-col gap-6 px-4 py-6 duration-300 ease-out-expo slide-in-from-bottom-2 motion-reduce:animate-none sm:px-6 lg:px-8 lg:py-7"
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-portal-title font-bold text-foreground">{t('title')}</h1>
        <p className="text-lede text-body">{t('description')}</p>
      </div>

      {status === 'loading' ? (
        <div role="status" aria-label={t('list.loading')} className="flex flex-col gap-4">
          <Skeleton className="h-24 w-full rounded-card" />
          <Skeleton className="h-24 w-full rounded-card" />
        </div>
      ) : null}

      {status === 'error' ? (
        <Alert
          variant="error"
          title={t('list.errorTitle')}
          action={
            <Button
              variant="outline"
              size="sm"
              className={TEACHER_RETRY_BUTTON_CLASS}
              loading={dashboard.isFetching}
              onClick={() => dashboard.refetch()}
            >
              {t('list.retry')}
            </Button>
          }
        >
          {t('list.errorDescription')}
        </Alert>
      ) : null}

      {status === 'empty' ? (
        <section className="flex flex-col rounded-card bg-card px-6 py-6 shadow-sm sm:px-7.5">
          <EmptyState
            icon={Users}
            tone="brand"
            title={t('list.emptyTitle')}
            description={t('list.emptyDescription')}
            className="border-none px-0 py-2"
          />
        </section>
      ) : null}

      {status === 'ready' ? (
        <ul role="list" data-slot="results-class-list" className="flex list-none flex-col gap-4">
          {classes.map((classCard) => (
            <li key={classCard.class_document_id} className="flex min-w-0 flex-col">
              <ResultsClassRow classCard={classCard} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export { ResultsScreen };
