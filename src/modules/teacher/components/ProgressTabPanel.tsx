'use client';

import { useTranslations } from 'next-intl';

import { Skeleton } from '@/components/ui/skeleton';
import { Alert, Button } from '@/modules/design-system';
import { ProgressAcaraSection } from '@/modules/teacher/components/ProgressAcaraSection';
import { ProgressEmptyState } from '@/modules/teacher/components/ProgressEmptyState';
import { ProgressShiftTable } from '@/modules/teacher/components/ProgressShiftTable';
import { ProgressSummarySection } from '@/modules/teacher/components/ProgressSummarySection';
import { ProgressWatchSection } from '@/modules/teacher/components/ProgressWatchSection';
import { deriveProgressStatus, progressView } from '@/modules/teacher/lib/class-progress';
import { useClassProgressQuery } from '@/modules/teacher/queries/use-class-progress.query';
import type { ProgressTabPanelProps } from '@/modules/teacher/types/class-progress.types';

// The Progress tab: ONE live read of C-TR-4 (GET /api/teacher/classes/:id/progress).
//
// TWO states, and the SERVER decides which: `available: false` renders the
// placeholder with the real Test A / Test B completion counts, `available: true`
// renders the stat row, the subskill mastery shift table, the ACARA phase
// movement cards and Students to watch. The portal never infers emptiness from an
// array it found empty, never zero-fills a suppressed comparison, and never
// re-thresholds a likelihood — every count here was already computed server-side
// over the both-tests cohort with `Config.teacher_mastery_bands`.
function ProgressTabPanel({ classDocumentId }: ProgressTabPanelProps) {
  const t = useTranslations('Teacher.results.progress');
  const progress = useClassProgressQuery(classDocumentId);
  const status = deriveProgressStatus({
    isLoading: progress.isPending,
    isError: progress.isError,
    isSuccess: progress.isSuccess,
    data: progress.data,
  });
  const view = progress.data ? progressView(progress.data) : null;
  const failed = status === 'error' || status === 'drift';

  return (
    <div data-slot="class-progress" data-status={status} className="flex flex-col gap-6">
      {status === 'loading' ? (
        <div role="status" aria-label={t('loading')} className="flex flex-col gap-4">
          <Skeleton className="h-32 w-full rounded-card" />
          <Skeleton className="h-64 w-full rounded-card" />
          <Skeleton className="h-40 w-full rounded-card" />
        </div>
      ) : null}

      {failed ? (
        <Alert
          variant="error"
          title={status === 'drift' ? t('driftTitle') : t('errorTitle')}
          action={
            <Button
              variant="outline"
              size="sm"
              loading={progress.isFetching}
              onClick={() => progress.refetch()}
            >
              {t('retry')}
            </Button>
          }
        >
          {status === 'drift' ? t('driftDescription') : t('errorDescription')}
        </Alert>
      ) : null}

      {view?.kind === 'unavailable' ? <ProgressEmptyState cohort={view.cohort} /> : null}

      {view?.kind === 'ready' ? (
        <>
          <ProgressSummarySection
            cohort={view.cohort}
            summary={view.summary}
            compared={view.compared}
          />
          <ProgressShiftTable shift={view.shift} compared={view.compared} />
          <ProgressAcaraSection movement={view.movement} />
          <ProgressWatchSection
            mostImproved={view.mostImproved}
            needsAttention={view.needsAttention}
          />
        </>
      ) : null}
    </div>
  );
}

export { ProgressTabPanel };
