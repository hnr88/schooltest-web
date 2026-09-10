'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { TEST_SLOTS } from '@/modules/classes/constants/subskills.constants';
import { EMPTY_VALUE } from '@/modules/classes/lib/class-detail.helpers';

import type { StudentTestResult } from '@/modules/classes/types/class-detail.types';

// S06h (School Admin Portal.dc.html:498–514, data :1466–475… logic :1466–1474)
// — the dated test-history rows under the two test cards. One row per slot,
// ALWAYS in A-then-B order, with the design's three sub-line forms mapping
// 1:1 onto the shipped status enum:
//   completed   → "Completed <date> · <n> min" (duration derived client-side
//                 from completed_at − started_at; a null half renders no
//                 duration, never a negative or a zero)
//   in_progress → "Started <date> · not submitted"
//   not_started → "Not started", score column an em dash, never 0
//
// Dates go through useFormatter().dateTime (the L-columns date archetype) —
// never date-fns with a pinned English pattern. No action row ships: the
// design's Assign-test and Export-report buttons have no server surface
// (D-04; the only export here is the class-scoped markdown one), and OP-2
// forbids a control wired to a stub. The "Enrolled at" history row is the
// student record's (S06e, task 14) — not this contract.
function minutesBetween(startedAt: string, completedAt: string): number | null {
  const start = new Date(startedAt).getTime();
  const end = new Date(completedAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
  return Math.round((end - start) / 60_000);
}

function HistoryRow({ test }: { test: StudentTestResult }) {
  const t = useTranslations('Classes.studentDetail');
  const format = useFormatter();
  const fmtDate = (iso: string): string =>
    format.dateTime(new Date(iso), { day: 'numeric', month: 'short', year: 'numeric' });

  let subLine: string;
  if (test.status === 'completed' && test.completed_at) {
    const date = fmtDate(test.completed_at);
    const minutes =
      test.started_at !== null ? minutesBetween(test.started_at, test.completed_at) : null;
    subLine =
      minutes === null
        ? t('history.completedPlain', { date })
        : t('history.completedWithDuration', { date, minutes });
  } else if (test.status === 'in_progress') {
    subLine =
      test.started_at !== null
        ? t('history.started', { date: fmtDate(test.started_at) })
        : t('history.inProgress');
  } else {
    subLine = t('history.notStarted');
  }

  const dotClass =
    test.status === 'completed'
      ? 'bg-success'
      : test.status === 'in_progress'
        ? 'bg-warning'
        : 'bg-muted-foreground/40';

  return (
    <li className="flex items-center gap-3 py-2.5" data-testid={`history-row-${test.test_id}`}>
      <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${dotClass}`} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-body-sm font-medium text-foreground">
          {t('history.rowTitle', { slot: test.test_id })}
        </span>
        <span className="block truncate text-xs text-body">{subLine}</span>
      </span>
      <span className="shrink-0 text-body-sm font-medium text-foreground">
        {test.overall_score === null
          ? EMPTY_VALUE
          : t('overallValue', { score: test.overall_score })}
      </span>
    </li>
  );
}

export function StudentTestHistoryPanel({ tests }: { tests: StudentTestResult[] }) {
  const t = useTranslations('Classes.studentDetail');
  const bySlot = new Map(tests.map((test) => [test.test_id, test]));

  return (
    <section
      aria-labelledby="test-history-heading"
      data-slot="student-test-history"
      className="rounded-xl border border-border bg-card p-4 sm:p-5"
    >
      <h3 id="test-history-heading" className="text-base font-medium text-foreground">
        {t('history.heading')}
      </h3>
      <ul className="mt-1 divide-y divide-divider">
        {TEST_SLOTS.map((slot) => {
          const test = bySlot.get(slot);
          return test ? <HistoryRow key={slot} test={test} /> : null;
        })}
      </ul>
    </section>
  );
}
