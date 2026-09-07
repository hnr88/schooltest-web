'use client';

import { useTranslations } from 'next-intl';

import { Skeleton } from '@/components/ui/skeleton';
import { Alert, Button } from '@/modules/design-system';
import { ParentReportView } from '@/modules/report/components/ParentReportView';
import { buildFamilyPreview } from '@/modules/report/lib/parent-view-model';
import { useStudentResultQuery } from '@/modules/results/queries/use-student-result.query';

/**
 * Task 35's wiring: the ONE client component behind the family preview route.
 * It reads the SAME C-4 result the student screen reads (no second contract),
 * projects it through the allow-list view model (`buildFamilyPreview` — the
 * only place a field decides whether the family surface shows it), and mounts
 * `ParentReportView`. No posterior reaches this component's output: the model
 * builder is where that guarantee lives, and task 38's grep guards enforce it.
 */
export function FamilyPreviewWired({ resultId }: { resultId: string }) {
  const t = useTranslations('Teacher.results.detail');
  const query = useStudentResultQuery(resultId);

  if (query.isPending) {
    return (
      <div role="status" aria-label={t('loading')} className="flex flex-col gap-4">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-40 w-full rounded-card" />
      </div>
    );
  }

  if (query.isError || query.data === undefined) {
    return (
      <Alert
        variant="error"
        title={t('errorTitle')}
        action={
          <Button
            variant="outline"
            size="sm"
            loading={query.isFetching}
            onClick={() => void query.refetch()}
          >
            {t('retry')}
          </Button>
        }
      >
        {t('errorDescription')}
      </Alert>
    );
  }

  return <ParentReportView view={buildFamilyPreview(query.data)} />;
}
