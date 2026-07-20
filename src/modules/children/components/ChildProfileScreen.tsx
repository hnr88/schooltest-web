'use client';

import { Alert, Button, Skeleton } from '@/modules/design-system';
import { ChildLearningSummary } from '@/modules/children/components/ChildLearningSummary';
import { ChildMetrics } from '@/modules/children/components/ChildMetrics';
import { ChildProfileHeader } from '@/modules/children/components/ChildProfileHeader';
import { ChildResults } from '@/modules/children/components/ChildResults';
import { useChildProgressQuery } from '@/modules/children/queries/use-child-progress.query';
import { useTranslations } from 'next-intl';

interface ChildProfileScreenProps {
  documentId: string;
}

export function ChildProfileScreen({ documentId }: ChildProfileScreenProps) {
  const t = useTranslations('Children');
  const { data, isError, isFetching, isLoading, refetch } = useChildProgressQuery(documentId);

  if (isLoading) {
    return (
      <main className="flex flex-1 flex-col gap-6 px-8 py-7" aria-hidden="true">
        <Skeleton className="h-11 w-40" />
        <Skeleton className="h-52 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </main>
    );
  }

  if (isError || !data) {
    return (
      <main className="flex flex-1 flex-col px-8 py-7">
        <div className="mx-auto w-full max-w-160">
          <Alert
            variant="error"
            title={t('profileErrorTitle')}
            action={
              <div className="flex flex-wrap gap-3">
                <Button
                  href="/dashboard/children"
                  variant="outline"
                  size="sm"
                  className="h-11 px-4"
                >
                  {t('backToList')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-11 px-4"
                  loading={isFetching}
                  onClick={() => refetch()}
                >
                  {t('retry')}
                </Button>
              </div>
            }
          >
            {t('profileErrorDescription')}
          </Alert>
        </div>
      </main>
    );
  }

  return (
    <main
      data-surface="child-learning-dashboard"
      className="flex flex-1 animate-in flex-col gap-6 px-8 py-7 duration-300 ease-out slide-in-from-bottom-2 motion-reduce:animate-none"
    >
      <ChildProfileHeader student={data.student} />
      <ChildLearningSummary metrics={data.metrics} />
      <ChildMetrics metrics={data.metrics} />
      <ChildResults results={data.recentResults} />
    </main>
  );
}
