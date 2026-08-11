'use client';

import { Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Skeleton } from '@/components/ui/skeleton';
import { Alert, Button, EmptyState } from '@/modules/design-system';
import { TeacherClassCard } from '@/modules/teacher/components/TeacherClassCard';
import { deriveDashboardStatus } from '@/modules/teacher/lib/dashboard-cards';
import { useTeacherDashboardQuery } from '@/modules/teacher/queries/use-teacher-dashboard.query';

// /dashboard for a teacher (.qa/DECISIONS.md A4): ONE shell, role-filtered, so
// the teacher's Dashboard IS this route — the parent Overview keeps it for every
// other role and is never rendered here.
//
// Everything on the page comes from one live read of C-TD-1. There is no seed
// list, no placeholder card and no "0 of 0" stand-in: a failed read renders the
// error branch, and an empty `classes` array is only ever believed once the read
// has actually succeeded. The live-session banner is task 033's slice.
function TeacherDashboardScreen() {
  const t = useTranslations('Teacher.dashboard');
  const dashboard = useTeacherDashboardQuery();
  const classes = dashboard.data?.classes ?? [];
  const status = deriveDashboardStatus({
    isLoading: dashboard.isPending,
    isError: dashboard.isError,
    isSuccess: dashboard.isSuccess,
    classCount: classes.length,
  });

  return (
    <main
      data-surface="teacher-dashboard"
      data-status={status}
      className="flex flex-1 animate-in flex-col gap-6 px-4 py-6 duration-300 ease-out-expo slide-in-from-bottom-2 motion-reduce:animate-none sm:px-6 lg:px-8 lg:py-7"
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-portal-title font-bold text-foreground">{t('title')}</h1>
        <p className="text-lede text-muted-foreground">{t('description')}</p>
      </div>

      {status === 'loading' ? (
        <div role="status" aria-label={t('loading')} className="grid gap-5 sm:grid-cols-2">
          <Skeleton className="h-56 w-full rounded-card" />
          <Skeleton className="h-56 w-full rounded-card" />
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
              loading={dashboard.isFetching}
              onClick={() => dashboard.refetch()}
            >
              {t('retry')}
            </Button>
          }
        >
          {t('errorDescription')}
        </Alert>
      ) : null}

      {status === 'empty' ? (
        <section className="flex flex-col rounded-card bg-card px-6 py-6 shadow-sm sm:px-7.5">
          <EmptyState
            icon={Users}
            tone="brand"
            title={t('emptyTitle')}
            description={t('emptyDescription')}
            className="border-none px-0 py-2"
          />
        </section>
      ) : null}

      {status === 'ready' ? (
        <ul
          role="list"
          data-slot="teacher-class-cards"
          className="grid list-none gap-5 sm:grid-cols-2"
        >
          {classes.map((classCard) => (
            <li key={classCard.class_document_id} className="min-w-0">
              <TeacherClassCard classCard={classCard} />
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  );
}

export { TeacherDashboardScreen };
