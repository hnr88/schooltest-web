'use client';

import { useTranslations } from 'next-intl';

import { Skeleton } from '@/components/ui/skeleton';
import { DIRECTORY_DEFAULT_LABELS, DirectoryError } from '@/modules/directory';
import { SessionActivityPanel } from '@/modules/test-day';
import { useRecordCrumb } from '@/modules/shell';
import { LiveMonitorGrid } from '@/modules/teacher/components/LiveMonitorGrid';
import { LiveMonitorHeader } from '@/modules/teacher/components/LiveMonitorHeader';
import { LiveMonitorLegend } from '@/modules/teacher/components/LiveMonitorLegend';
import { LiveMonitorSummary } from '@/modules/teacher/components/LiveMonitorSummary';
import { useLiveMonitor } from '@/modules/teacher/hooks/useLiveMonitor';
import type { LiveMonitorScreenProps } from '@/modules/teacher/types/live-monitor.types';

// /dashboard/test-sessions/<sittingDocumentId> — the live monitoring view behind
// "Go live" (.qa/DESIGN.md §Live monitoring, wireframe 09 view 2). ONE live read,
// C-TS-3, polled by TanStack Query while the sitting is open, so a student
// joining flips their tile with no manual reload.
//
// A failed read renders the error branch and NOTHING else: there is no cached
// grid, no zero-filled counter row and no "not joined" placeholder standing in
// for a 403 (foreign sitting) or a 404 (unknown sitting).
//
// `aria-live="polite"` on the counters is what makes the poll perceivable without
// sight — the numbers are announced when they change, and never more often.
function LiveMonitorScreen({ sittingDocumentId }: LiveMonitorScreenProps) {
  const t = useTranslations('Teacher.testSessions.live');
  const monitor = useLiveMonitor(sittingDocumentId);

  useRecordCrumb(monitor.sitting?.class.name);

  return (
    <main
      data-surface="teacher-live-monitor"
      data-status={monitor.status}
      data-sitting-id={sittingDocumentId}
      className="flex flex-1 animate-in flex-col gap-6 px-4 py-6 duration-300 ease-out-expo slide-in-from-bottom-2 motion-reduce:animate-none sm:px-6 lg:px-8 lg:py-7"
    >
      {monitor.status === 'loading' ? (
        <div role="status" aria-label={t('loading')} className="flex flex-col gap-4">
          <Skeleton className="h-9 w-2/5" />
          <Skeleton className="h-20 w-full rounded-card" />
          <Skeleton className="h-64 w-full rounded-card" />
        </div>
      ) : null}

      {monitor.status === 'error' ? (
        // ops/34 — the kit's error state replaces the bespoke Alert: the same
        // copy (title, description, retry) with the kit's focus-managed
        // heading, so a failed live read looks like every other list's.
        <DirectoryError
          labels={{
            ...DIRECTORY_DEFAULT_LABELS,
            errorTitle: t('errorTitle'),
            errorDescription: t('errorDescription'),
            retry: t('retry'),
          }}
          onRetry={monitor.retry}
          retrying={monitor.isRefetching}
        />
      ) : null}

      {monitor.status === 'ready' && monitor.sitting && monitor.stallThresholdMinutes !== null ? (
        <>
          <LiveMonitorHeader
            sitting={monitor.sitting}
            testLabel={monitor.testLabel}
            startedMinutesAgo={monitor.startedMinutesAgo}
          />

          <div
            aria-live="polite"
            className="flex flex-col gap-6 rounded-card bg-card px-6 py-6 shadow-sm sm:px-7.5"
          >
            <LiveMonitorSummary items={monitor.summaryItems} />
            <LiveMonitorGrid students={monitor.students} />
            <LiveMonitorLegend stallThresholdMinutes={monitor.stallThresholdMinutes} />
          </div>

          {/* C-SIT-ACTIVITY (teacher task 13) — the trail rides the monitor's
              ready branch; task 18 mounts the same panel for class-scoped
              S09d. The scope is a prop, never a forked copy. */}
          <SessionActivityPanel sittingDocumentId={sittingDocumentId} scope="sitting" />
        </>
      ) : null}
    </main>
  );
}

export { LiveMonitorScreen };
