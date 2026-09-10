'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { StatusPill } from '@/modules/design-system';
import { EndSessionControl } from '@/modules/teacher/components/EndSessionControl';
import { SessionMissingValue } from '@/modules/teacher/components/SessionMissingValue';
import { ROW_ORDER, SessionSettingsModal } from '@/modules/teacher/components/SessionSettingsModal';
import { DEFAULT_SITTING_SETTINGS } from '@/modules/teacher/schemas/teacher-session.schema';
import type { LiveMonitorHeaderProps } from '@/modules/teacher/types/live-monitor.types';

// .qa/DESIGN.md §Live monitoring, the header: the LIVE badge, "Session started N
// min ago", "<class> — <test>" and the join code.
//
// `status`, `code` and `opened_at` are all C-TS-3's. A sitting closed while the
// page was open reports CLOSED (in words, not by dropping a colour), a sitting
// with no minted code shows the missing-value dash, and a sitting with no
// `opened_at` simply omits the age line instead of guessing "0 min ago".
// The "End session" control (C-TS-4) sits at the end of this row and renders
// itself only while the sitting is open.
//
// teacher task 11 — the "Test settings" control (:1090) opens S18, the
// read-only modal, raised from the control itself. The count label is client
// formatting of the SERVED settings (:4268–4271, logic.md#derived) — never a
// second derivation. The modal renders the design defaults while the monitor
// read does not yet carry `sitting.settings` (task 12's widening supplies it).
function LiveMonitorHeader({ sitting, testLabel, startedMinutesAgo }: LiveMonitorHeaderProps) {
  const t = useTranslations('Teacher.testSessions.live');
  const isOpen = sitting.status === 'open';
  const [settingsOpen, setSettingsOpen] = useState(false);

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

      <div className="flex flex-wrap items-center gap-3">
        <p
          data-slot="live-monitor-code"
          className="rounded-tile bg-surface-inset px-4 py-2 font-mono text-body-lg font-bold tracking-widest break-all text-foreground select-all"
        >
          {sitting.code === null ? <SessionMissingValue label={t('noCode')} /> : sitting.code}
        </p>
        {/* teacher task 11 — the "Test settings" control (:1090): the count is
            client formatting of the SERVED settings; until task 12's monitor
            widening threads `sitting.settings`, every sitting renders the
            design defaults (the `settings: null` arm is the live arm). */}
        <button
          type="button"
          data-slot="live-monitor-settings-control"
          onClick={() => setSettingsOpen(true)}
          className="rounded-tile border border-divider bg-card px-4 py-2 text-body-sm font-semibold text-body transition-colors hover:border-primary/40"
        >
          {t('settings.control')}{' '}
          <span className="text-muted-foreground">
            {t('settings.count', {
              on: ROW_ORDER.filter((key) => DEFAULT_SITTING_SETTINGS[key]).length,
              total: ROW_ORDER.length,
            })}
          </span>
        </button>
        <EndSessionControl sitting={sitting} />
      </div>

      <SessionSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={null}
      />
    </header>
  );
}

export { LiveMonitorHeader };
