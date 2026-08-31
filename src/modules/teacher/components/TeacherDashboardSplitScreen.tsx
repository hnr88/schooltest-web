'use client';

import { useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { Users } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from '@/i18n/navigation';
import { Alert, Button, EmptyState, StatusPill } from '@/modules/design-system';
import { ClassResultsStat } from '@/modules/teacher/components/ClassResultsStat';
import { TeacherLiveSessionBanner } from '@/modules/teacher/components/TeacherLiveSessionBanner';
import {
  MONITOR_SUMMARY_LABEL_KEY,
  MONITOR_SUMMARY_VALUE_CLASS,
} from '@/modules/teacher/constants/live-monitor.constants';
import { TEACHER_RETRY_BUTTON_CLASS } from '@/modules/teacher/constants/a11y.constants';
import { useClassResultsStats } from '@/modules/teacher/hooks/useClassResultsStats';
import { deriveDashboardStatus } from '@/modules/teacher/lib/dashboard-cards';
import { useClassStudentsQuery } from '@/modules/teacher/queries/use-class-students.query';
import { useTeacherDashboardQuery } from '@/modules/teacher/queries/use-teacher-dashboard.query';
import { useTestSessionMonitorQuery } from '@/modules/teacher/queries/use-test-session-monitor.query';
import type { MonitorSummaryKey } from '@/modules/teacher/types/live-monitor.types';
import type { ClassResultsHeaderProps } from '@/modules/teacher/types/results-shell.types';
import type { DashboardClass } from '@/modules/teacher/types/teacher.types';
import type { MonitorSummary } from '@/modules/teacher/types/teacher-session.types';

// Dash C (Split) — the ONE teacher dashboard the operator locked (.codephant/
// design-system-diff.md: "Teacher dashboard — split class navigator and detail" —
// PARTIAL: "the one-screen split nav+detail pane is NOT present"). Left class-
// picker rail, right selected-class detail pane carrying class actions, the
// C-TR-1 summary stat strip and (when a sitting is live) the live-sitting
// counters. Pure composition: every number is read from the existing query hooks
// below; nothing is averaged, counted or re-thresholded here.
//
// The action links point at the EXISTING routes (Roster / Results / Test day —
// the codebase's name for the design's "Run a test", which is the test-day
// route), so this screen is additive: it never removes or downgrades them, and
// the RosterScreen, results and test-day routes keep working exactly as before.
function TeacherDashboardSplitScreen() {
  const t = useTranslations('Teacher.dashboard');
  const tTeach = useTranslations('Teach');
  const dashboard = useTeacherDashboardQuery();
  const classes = dashboard.data?.classes ?? [];
  const liveSession = dashboard.data?.live_session ?? null;
  const status = deriveDashboardStatus({
    isLoading: dashboard.isPending,
    isError: dashboard.isError,
    isSuccess: dashboard.isSuccess,
    classCount: classes.length,
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId ? classes.find((c) => c.class_document_id === selectedId) ?? null : null;
  const activeClass = selected ?? classes[0] ?? null;

  return (
    <div
      data-surface="teacher-dashboard-split"
      data-status={status}
      className="flex flex-1 animate-in flex-col gap-6 px-4 py-6 duration-300 ease-out-expo slide-in-from-bottom-2 motion-reduce:animate-none sm:px-6 lg:px-8 lg:py-7"
    >
      <TeacherLiveSessionBanner />

      <div className="flex flex-col gap-1">
        <h1 className="text-portal-title font-bold text-foreground">{t('title')}</h1>
        <p className="text-lede text-body">{t('description')}</p>
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
              className={TEACHER_RETRY_BUTTON_CLASS}
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

      {status === 'ready' && activeClass ? (
        <div className="grid items-start gap-6 lg:grid-cols-[280px_1fr]">
          <aside
            aria-label={tTeach('home.classesTitle')}
            className="flex flex-col gap-3 rounded-card border border-border bg-card p-3 shadow-sm"
          >
            <h2 className="px-1 text-meta font-semibold tracking-wide text-body uppercase">
              {tTeach('home.classesTitle')}
            </h2>
            <ul role="list" className="flex list-none flex-col gap-2">
              {classes.map((classCard) => {
                const isActive = classCard.class_document_id === activeClass.class_document_id;
                const isLive = liveSession !== null && liveSession.class_name === classCard.name;
                return (
                  <li key={classCard.class_document_id}>
                    <button
                      type="button"
                      aria-pressed={isActive}
                      data-class-id={classCard.class_document_id}
                      data-live={isLive ? 'true' : 'false'}
                      onClick={() => setSelectedId(classCard.class_document_id)}
                      className={cn(
                        'flex w-full flex-col gap-1 rounded-tile px-3 py-3 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                        isActive ? 'bg-surface-inset shadow-sm' : 'hover:bg-surface-inset',
                      )}
                    >
                      <span className="flex items-center gap-2 text-body-sm font-semibold text-foreground">
                        {classCard.name}
                        {isLive ? (
                          <StatusPill tone="warning" className="bg-warning-ink text-warning-soft">
                            {t('liveBanner.live')}
                          </StatusPill>
                        ) : null}
                      </span>
                      <span className="text-meta text-body">
                        {classCard.year_band ? `${classCard.year_band} · ` : ''}
                        {t('students', { count: classCard.student_count })}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          <DetailPane
            classCard={activeClass}
            liveSittingId={
              liveSession && liveSession.class_name === activeClass.name
                ? liveSession.sitting_document_id
                : null
            }
          />
        </div>
      ) : null}
    </div>
  );
}

function DetailPane({
  classCard,
  liveSittingId,
}: {
  classCard: DashboardClass;
  liveSittingId: string | null;
}) {
  const t = useTranslations('Teacher.results.detail');
  const tTeach = useTranslations('Teach');
  const tLive = useTranslations('Teacher.testSessions.live');
  const students = useClassStudentsQuery(classCard.class_document_id);
  const monitor = useTestSessionMonitorQuery(liveSittingId ?? '');
  const className = students.data?.class.name ?? classCard.name;
  const studentCount = students.data?.class.student_count ?? classCard.student_count;

  return (
    <section
      data-slot="teacher-dashboard-detail"
      data-class-id={classCard.class_document_id}
      aria-labelledby="teacher-dashboard-detail-title"
      className="flex flex-col gap-5 rounded-card border border-border bg-card p-5 shadow-sm"
    >
      <header className="flex min-w-0 flex-col gap-1">
        <h2 id="teacher-dashboard-detail-title" className="text-panel-title font-semibold text-foreground">
          {className}
        </h2>
        <p className="text-meta text-body">{t('students', { count: studentCount })}</p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/dashboard/teach/classes/${classCard.class_document_id}`}
          className="inline-flex min-h-11 w-fit items-center rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors duration-150 hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {tTeach('home.rosterLink')}
        </Link>
        <Link
          href={`/dashboard/teach/results/${classCard.class_document_id}`}
          className="inline-flex min-h-11 w-fit items-center rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors duration-150 hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {tTeach('home.resultsLink')}
        </Link>
        <Link
          href={`/dashboard/teach/classes/${classCard.class_document_id}/test-day`}
          className="inline-flex min-h-11 w-fit items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors duration-150 hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {tTeach('home.testDayLink')}
        </Link>
      </div>

      {students.isPending ? (
        <div role="status" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-20 w-full rounded-tile" />
          <Skeleton className="h-20 w-full rounded-tile" />
          <Skeleton className="h-20 w-full rounded-tile" />
          <Skeleton className="h-20 w-full rounded-tile" />
        </div>
      ) : null}

      {students.isError ? (
        <Alert variant="error" title={t('errorTitle')}>
          {t('errorDescription')}
        </Alert>
      ) : null}

      {students.isSuccess && students.data ? <StatsGrid summary={students.data.summary} /> : null}

      {liveSittingId !== null && monitor.data ? (
        <div className="flex flex-col gap-3 rounded-tile border border-warning/45 bg-warning-soft px-4 py-4 text-warning-ink">
          <h3 className="text-meta font-semibold tracking-wide text-warning-ink uppercase">
            {tLive('summaryLabel')}
          </h3>
          <MonitorSummaryTiles summary={monitor.data.summary} />
        </div>
      ) : null}
    </section>
  );
}

function StatsGrid({ summary }: { summary: ClassResultsHeaderProps['summary'] }) {
  const stats = useClassResultsStats(summary);

  return (
    <section aria-label="class-summary">
      <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <ClassResultsStat key={item.key} item={item} />
        ))}
      </dl>
    </section>
  );
}

// The live-sitting counters (the design's fifth, scoring-failed, included). The
// summary is read straight off C-TS-3; the portal never counts the grouped
// roster itself. `scoring_failed` is OPTIONAL on the wire: when the API omits it
// the tile shows the codebase's usual ABSENT mark ("—", `Teacher.results.detail.
// noValue`) instead of a fabricated 0 — a field the server did not report must
// never read as "0 failures". `expected` is kept because it is the projected
// roster headcount C-TS-3 reports and the live-monitor surface already leads
// with it (it is the denominator the rest of the counters partition against).
const SUMMARY_TILE_ORDER: readonly MonitorSummaryKey[] = [
  'expected',
  'joined',
  'in_progress',
  'submitted',
  'stalled',
  'scoring_failed',
];

function MonitorSummaryTiles({ summary }: { summary: MonitorSummary }) {
  const t = useTranslations('Teacher.testSessions.live');
  const tNoValue = useTranslations('Teacher.results.detail');
  const format = useFormatter();

  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {SUMMARY_TILE_ORDER.map((key) => {
        const value = summary[key];
        const absent = value === undefined;
        return (
          <div
            key={key}
            data-slot="live-monitor-stat"
            data-stat={key}
            className="flex flex-col items-center gap-0.5 rounded-tile bg-surface-inset px-3 py-3"
          >
            <dd
              className={cn(
                'order-1 text-stat-sm font-bold tabular-nums',
                MONITOR_SUMMARY_VALUE_CLASS[key],
                absent && 'text-muted-foreground',
              )}
            >
              {absent ? tNoValue('noValue') : format.number(value)}
            </dd>
            <dt className="order-2 text-center text-meta text-body">
              {t(MONITOR_SUMMARY_LABEL_KEY[key])}
            </dt>
          </div>
        );
      })}
    </dl>
  );
}

export { TeacherDashboardSplitScreen };
