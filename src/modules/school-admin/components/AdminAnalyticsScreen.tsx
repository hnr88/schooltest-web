'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { useAuthStore } from '@/modules/auth';
import { useSchoolClassesQuery } from '@/modules/classes';
import { Alert, Button, Skeleton } from '@/modules/design-system';
import { ResultsExportButton } from '@/modules/school-admin/components/ResultsExportButton';
import { SchoolAggregatePanel } from '@/modules/school-admin/components/SchoolAggregatePanel';
import { DiagnosticDashboard, ProgressPanel } from '@/modules/teach';

// School administrator analytics (task 78, mvp spec 4.3): the three-level
// view - school overview aggregates, class drill-down, student drill-down -
// carrying the SAME diagnostic and progress components as the teacher
// dashboard (task 75/76) at school scope, with the same honest empty states.
// Level 3 (student) is the one-click drill inside DiagnosticDashboard. The
// C-RPT-05 school results export lives in the header.
export function AdminAnalyticsScreen() {
  const t = useTranslations('SchoolAdmin.analytics');
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const classesQuery = useSchoolClassesQuery(hydrated && Boolean(token));
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  if (classesQuery.isPending) {
    return (
      <main className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Skeleton className="h-9 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-40 w-full" />
      </main>
    );
  }

  if (classesQuery.isError) {
    return (
      <main className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Alert
          variant="error"
          title={t('errorTitle')}
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={classesQuery.isFetching}
              onClick={() => classesQuery.refetch()}
            >
              {t('retry')}
            </Button>
          }
        >
          {t('errorDescription')}
        </Alert>
      </main>
    );
  }

  const classes = classesQuery.data;

  if (selectedClassId) {
    return (
      <>
        <DiagnosticDashboard
          classId={selectedClassId}
          backHref="/dashboard/school/analytics"
          actions={<ResultsExportButton />}
        />
        <ProgressPanel classId={selectedClassId} />
      </>
    );
  }

  return (
    <main
      data-slot="school-analytics"
      data-surface="school-admin-analytics"
      className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
          <p className="max-w-xl text-sm text-body">{t('subtitle')}</p>
        </div>
        <ResultsExportButton />
      </div>

      {classes.length === 0 ? (
        <section className="flex flex-col gap-2 rounded-xl border border-border bg-card px-4 py-6">
          <h2 className="text-lg font-semibold text-foreground">{t('emptyTitle')}</h2>
          <p className="max-w-xl text-sm text-body">{t('emptyDescription')}</p>
        </section>
      ) : (
        <SchoolAggregatePanel classes={classes} onSelectClass={setSelectedClassId} />
      )}
    </main>
  );
}
