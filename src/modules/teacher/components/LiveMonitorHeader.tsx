'use client';

import { useTranslations } from 'next-intl';

import { StatusPill } from '@/modules/design-system';
import { SessionMissingValue } from '@/modules/teacher/components/SessionMissingValue';
import type { LiveMonitorHeaderProps } from '@/modules/teacher/types/live-monitor.types';

// .qa/DESIGN.md §Live monitoring, the header: the LIVE badge, "Session started N
// min ago", "<class> — <test>" and the join code.
//
// `status`, `code` and `opened_at` are all C-TS-3's. A sitting closed while the
// page was open reports CLOSED (in words, not by dropping a colour), a sitting
// with no minted code shows the missing-value dash, and a sitting with no
// `opened_at` simply omits the age line instead of guessing "0 min ago".
// The "End session" control is task 038's and lands in this row.
function LiveMonitorHeader({ sitting, testLabel, startedMinutesAgo }: LiveMonitorHeaderProps) {
  const t = useTranslations('Teacher.testSessions.live');
  const isOpen = sitting.status === 'open';

  return (
    <header data-slot="live-monitor-header" className="flex flex-wrap items-start gap-4">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone={isOpen ? 'danger' : 'neutral'}>
            {isOpen ? (
              <>
                <span
                  aria-hidden="true"
                  className="mr-1.5 size-2 animate-pulse rounded-full bg-danger-strong motion-reduce:animate-none"
                />
                {t('badgeLive')}
              </>
            ) : (
              t('badgeClosed')
            )}
          </StatusPill>
          {startedMinutesAgo === null ? null : (
            <span className="text-body-sm text-body">
              {t('startedAgo', { minutes: startedMinutesAgo })}
            </span>
          )}
        </div>

        <h1 className="text-portal-title font-bold text-balance text-foreground">
          {testLabel === null
            ? sitting.class.name
            : t('title', { className: sitting.class.name, testLabel })}
        </h1>
      </div>

      <p
        data-slot="live-monitor-code"
        className="rounded-tile bg-surface-inset px-4 py-2 font-mono text-body-lg font-bold tracking-widest break-all text-foreground select-all"
      >
        {sitting.code === null ? <SessionMissingValue label={t('noCode')} /> : sitting.code}
      </p>
    </header>
  );
}

export { LiveMonitorHeader };
