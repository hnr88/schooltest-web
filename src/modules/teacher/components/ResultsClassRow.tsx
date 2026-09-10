'use client';

import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { StatusPill } from '@/modules/design-system';
import { classResultsHref } from '@/modules/teacher/lib/results-shell';
import { TeacherClassCompletionRow } from '@/modules/teacher/components/TeacherClassCompletionRow';
import type { ResultsClassRowProps } from '@/modules/teacher/types/results-shell.types';
import type { DashboardClass } from '@/modules/teacher/types/teacher.types';

/**
 * One class of the classes list, straight from C-TD-1 — in BOTH bodies of the
 * layout axis. The `cell` variant is the Class column's content inside the kit's
 * whole-row anchor (the anchor itself comes from `rowHref`, so nesting a second
 * Link here would be the nested-interactive failure axe reports); the `tile`
 * variant owns its whole-card anchor, as §L-rownav requires of non-table
 * layouts. Both carry `data-slot="results-class-row"` + `data-class-id`, which
 * every spec reads.
 *
 * The derived status is the server's own field (D-60): a class with an open
 * sitting renders the LIVE NOW badge and NO status pill — never both
 * (`:3082–3085`); the n > 1 overflow is spelled out as the badge's accessible
 * name ("N sessions live") from the served `open_session_count`. The card
 * mirrors the design's live treatment (`:3083–3084`): red border + glow.
 *
 * The badge is the first two chars of the name, derived client-side
 * (logic.md#payloads); so is the `form` letter — the variant whose completion
 * is non-zero, the design's "form A / form B" cycle position restated over the
 * completions the wire actually carries. No score is thresholded anywhere.
 */

/** The design's live card treatment, or the plain one. */
function cardClass(isLive: boolean): string {
  return isLive
    ? 'border-destructive/45 shadow-[0_0_0_3px_rgba(217,45,32,0.10)]'
    : 'border-border shadow-sm';
}

function ResultsClassStatus({ classCard }: { classCard: DashboardClass }) {
  const t = useTranslations('Teacher.results.list');
  const isLive = classCard.open_session_count > 0;
  if (isLive) {
    return (
      <span
        data-slot="results-live-badge"
        title={
          classCard.open_session_count > 1
            ? t('sessionsLive', { count: classCard.open_session_count })
            : undefined
        }
        className="inline-flex items-center gap-1.5 rounded-full bg-destructive py-1 pr-2.5 pl-2 text-[11px] font-bold tracking-widest text-white"
      >
        <span
          aria-hidden="true"
          className="size-1.5 animate-pulse rounded-full bg-white motion-reduce:animate-none"
        />
        {t('liveNow')}
      </span>
    );
  }
  return (
    <span data-slot="results-status">
      <StatusPill tone={STATUS_TONE[classCard.status]} className="font-medium">
        {t(STATUS_LABEL_KEY[classCard.status])}
      </StatusPill>
    </span>
  );
}

const STATUS_TONE = {
  sitting_now: 'danger',
  scheduled: 'warning',
  no_tests_yet: 'neutral',
  complete: 'success',
} as const;

const STATUS_LABEL_KEY = {
  sitting_now: 'statusSittingNow',
  scheduled: 'statusScheduled',
  no_tests_yet: 'statusNoTestsYet',
  complete: 'statusComplete',
} as const;

/** The four skill cells: Reading carries the real A/B completions; three Soon. */
function SkillCells({ classCard }: { classCard: DashboardClass }) {
  const t = useTranslations('Teacher.results.list');
  const tDash = useTranslations('Teacher.dashboard');
  return (
    <div className="grid grid-cols-2 gap-2 border-t border-divider pt-3 sm:grid-cols-4">
      <div className="col-span-2 flex min-w-0 flex-col gap-2 rounded-lg border border-divider bg-surface-well p-2.5 sm:col-span-1">
        <span className="text-[10px] font-semibold tracking-wider text-body uppercase">
          {t('reading')}
        </span>
        <TeacherClassCompletionRow label={tDash('testA')} completion={classCard.test_a} />
        <TeacherClassCompletionRow label={tDash('testB')} completion={classCard.test_b} />
      </div>
      <ResultsClassSoonCell label={t('listening')} />
      <ResultsClassSoonCell label={t('writing')} />
      <ResultsClassSoonCell label={t('speaking')} />
    </div>
  );
}

/** One Soon skill cell — the contract pins `skill: 'reading'` (teacher.ts:206–211). */
function ResultsClassSoonCell({ label }: { label: string }) {
  const t = useTranslations('Teacher.results.list');
  return (
    <div className="flex min-w-0 flex-col gap-1.5 rounded-lg border border-divider bg-surface-inset p-2.5">
      <span className="text-[10px] font-semibold tracking-wider text-body uppercase">
        {label}
      </span>
      <span className="text-[11.5px] font-semibold tracking-wide text-body uppercase">
        {t('soon')}
      </span>
    </div>
  );
}

function ResultsClassRow({ classCard, variant }: ResultsClassRowProps) {
  const t = useTranslations('Teacher.results.list');
  const isLive = classCard.open_session_count > 0;
  const badge = classCard.name.slice(0, 2);
  const yearBand = classCard.year_band ?? t('noValue');
  const formVariant = classCard.test_b.completed > 0 ? 'B' : 'A';
  const meta = t('meta', { year: yearBand, form: formVariant });

  if (variant === 'cell') {
    return (
      <span
        data-slot="results-class-row"
        data-class-id={classCard.class_document_id}
        className="flex min-w-0 items-center gap-3"
      >
        <span
          aria-hidden="true"
          className="flex size-8.5 shrink-0 items-center justify-center rounded-lg bg-surface-inset text-[12px] font-semibold text-body"
        >
          {badge}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-[14.5px] font-medium text-foreground">
            {classCard.name}
          </span>
          <span className="text-meta text-muted-foreground">{meta}</span>
        </span>
        <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
      </span>
    );
  }

  return (
    <Link
      href={classResultsHref(classCard.class_document_id)}
      data-slot="results-class-row"
      data-class-id={classCard.class_document_id}
      data-live={isLive || undefined}
      className={`flex min-h-44 flex-col gap-3.5 rounded-xl border bg-card p-4.5 transition-colors duration-200 ease-out hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none motion-reduce:transition-none ${cardClass(isLive)}`}
    >
      <span className="flex items-start justify-between gap-3">
        <span className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-surface-inset text-[13px] font-semibold text-body"
          >
            {badge}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-[15px] font-semibold text-foreground">
              {classCard.name}
            </span>
            <span className="text-[12.5px] text-muted-foreground">{meta}</span>
          </span>
        </span>
        <ResultsClassStatus classCard={classCard} />
      </span>

      <SkillCells classCard={classCard} />

      <span className="flex gap-5 border-t border-divider pt-3">
        <span className="flex min-w-0 flex-col">
          <span className="text-[10.5px] font-semibold tracking-wider text-muted-foreground uppercase">
            {t('studentsLabel')}
          </span>
          <span className="mt-1 text-[15px] font-semibold text-foreground tabular-nums">
            {classCard.student_count}
          </span>
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="text-[10.5px] font-semibold tracking-wider text-muted-foreground uppercase">
            {t('growth')}
          </span>
          <span className="mt-1 text-[15px] font-semibold text-muted-foreground tabular-nums">
            {t('noValue')}
          </span>
        </span>
      </span>
    </Link>
  );
}

export { ResultsClassRow, ResultsClassStatus, ResultsClassSoonCell };
