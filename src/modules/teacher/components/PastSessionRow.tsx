'use client';

import { useFormatter, useTranslations } from 'next-intl';

import {
  CompletionCell,
  StatusPill,
  TableCell,
  TableHead,
  TableRow,
} from '@/modules/design-system';
import { SessionMissingValue } from '@/modules/teacher/components/SessionMissingValue';
import {
  PAST_SESSION_STATUS_LABEL_KEY,
  PAST_SESSION_STATUS_TONE,
  PAST_SESSIONS_ROW_CLASS,
} from '@/modules/teacher/constants/past-sessions.constants';
import { sessionCompletionPercent } from '@/modules/teacher/lib/past-sessions';
import type { PastSessionRowProps } from '@/modules/teacher/types/past-sessions.types';

// One row of .qa/DESIGN.md's "Past sessions" table: Class · Test · Date ·
// Completed. Every value is C-TS-2's own field, printed verbatim — the class
// name and code as sent, the test's label as C-TD-2 names it, the sitting's own
// `status` word, and the server-derived `completed`/`expected` pair.
function PastSessionRow({ session, testLabel }: PastSessionRowProps) {
  const t = useTranslations('Teacher.testSessions.pastSessions');
  const format = useFormatter();

  return (
    <TableRow
      data-slot="past-session-row"
      data-status={session.status}
      className={PAST_SESSIONS_ROW_CLASS}
    >
      <TableHead scope="row" className="h-auto px-3 py-2 align-middle whitespace-normal">
        <span className="flex flex-col gap-0.5">
          <span
            data-slot="past-session-class"
            className="text-body-sm font-semibold text-foreground"
          >
            {session.class.name}
          </span>
          <span data-slot="past-session-code" className="text-meta text-muted-foreground">
            <span className="sr-only">{t('joinCodeLabel')}</span>{' '}
            {session.code === null ? (
              <SessionMissingValue label={t('noCode')} />
            ) : (
              <span className="tabular-nums">{session.code}</span>
            )}
          </span>
        </span>
      </TableHead>

      <TableCell
        data-slot="past-session-test"
        className="px-3 py-2 text-body-sm whitespace-normal text-body"
      >
        {testLabel === null ? <SessionMissingValue label={t('noTest')} /> : testLabel}
      </TableCell>

      <TableCell
        data-slot="past-session-date"
        className="px-3 py-2 text-body-sm text-muted-foreground"
      >
        <span className="flex flex-wrap items-center gap-2">
          {session.opened_at === null ? (
            <SessionMissingValue label={t('noDate')} />
          ) : (
            <time dateTime={session.opened_at}>
              {format.dateTime(new Date(session.opened_at), { dateStyle: 'medium' })}
            </time>
          )}
          <StatusPill tone={PAST_SESSION_STATUS_TONE[session.status]}>
            {t(PAST_SESSION_STATUS_LABEL_KEY[session.status])}
          </StatusPill>
        </span>
      </TableCell>

      <TableCell className="px-3 py-2">
        <CompletionCell
          className="w-32"
          value={sessionCompletionPercent(session)}
          display={t('completedValue', {
            completed: session.completed,
            expected: session.expected,
          })}
          ariaLabel={t('completedAria', {
            completed: session.completed,
            expected: session.expected,
            className: session.class.name,
          })}
        />
      </TableCell>
    </TableRow>
  );
}

export { PastSessionRow };
