'use client';

import { useMemo } from 'react';
import { useFormatter, useTranslations } from 'next-intl';

import { CompletionCell, StatusPill } from '@/modules/design-system';
import { SessionMissingValue } from '@/modules/teacher/components/SessionMissingValue';
import {
  PAST_SESSION_STATUS_LABEL_KEY,
  PAST_SESSION_STATUS_TONE,
} from '@/modules/teacher/constants/past-sessions.constants';
import { sessionCompletionPercent } from '@/modules/teacher/lib/past-sessions';
import { findTestLabel } from '@/modules/teacher/lib/join-code';
import type { DirectoryColumnDef } from '@/modules/directory';
import type { TeacherTestSession } from '@/modules/teacher/types/teacher-session.types';
import type { TeacherTest } from '@/modules/teacher/types/teacher.types';

/**
 * ops/34 — the four columns of the past-sessions list, in the kit's shape.
 * Every cell prints the exact content the retired `PastSessionRow` printed
 * (same data-slots, same copy), so the row contract tests pin is unchanged;
 * only the `<tr>`/cell wrappers are the kit's now. Date and Status are the
 * sortable headers (C-TS-2's own fields, no derived state).
 */
export function usePastSessionsColumns(
  tests: readonly TeacherTest[],
): readonly DirectoryColumnDef<TeacherTestSession>[] {
  const t = useTranslations('Teacher.testSessions.pastSessions');
  const format = useFormatter();

  return useMemo<readonly DirectoryColumnDef<TeacherTestSession>[]>(
    () => [
      {
        key: 'class',
        header: t('class'),
        cell: (session) => (
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
        ),
      },
      {
        key: 'test',
        header: t('test'),
        cell: (session) => {
          const label = findTestLabel(tests, session.variant);
          return (
            <span data-slot="past-session-test" className="text-body-sm whitespace-normal text-body">
              {label === null ? <SessionMissingValue label={t('noTest')} /> : label}
            </span>
          );
        },
      },
      {
        key: 'date',
        header: t('date'),
        sortable: true,
        sortValues: { asc: 'date:asc', desc: 'date:desc' },
        cell: (session) => (
          <span data-slot="past-session-date" className="text-body-sm text-muted-foreground">
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
          </span>
        ),
      },
      {
        key: 'completed',
        header: t('completed'),
        cell: (session) => (
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
        ),
      },
    ],
    [t, format, tests],
  );
}
