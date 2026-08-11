'use client';

import { ArrowRight, Radio } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { Button, StatusPill } from '@/modules/design-system';
import { testSessionMonitorHref } from '@/modules/teacher/lib/join-code';
import { useTeacherDashboardQuery } from '@/modules/teacher/queries/use-teacher-dashboard.query';

// .qa/DESIGN.md §Dashboard: "When a sitting is live, a yellow banner sits at the
// top with a 'View live →' link to that session's monitor."
//
// Driven by ONE field of ONE live read — C-TD-1's `live_session`, defined as
// "the caller's most recently opened status:'open' sitting, else null". So the
// banner exists exactly while the server says a sitting is open: it appears once
// C-TS-1 mints one (the create invalidates the `teacher` key, the dashboard
// re-reads) and it is gone on the next read after C-TS-4 closes it. Nothing is
// cached, remembered or inferred client-side, and a read still in flight or one
// that failed renders NO banner rather than a hopeful one.
//
// `code` and `opened_at` are nullable per the contract (a sitting created
// outside C-TS-1 mints neither); a missing code is REPORTED as missing, never
// filled in. The amber tint never carries the state alone — the LIVE pill spells
// it out in words (WCAG 2.2 AA) — and the link is `size="lg"` (h-11) with a
// visible focus ring from the shared Button.
function TeacherLiveSessionBanner() {
  const t = useTranslations('Teacher.dashboard.liveBanner');
  const format = useFormatter();
  const dashboard = useTeacherDashboardQuery();
  const liveSession = dashboard.data?.live_session ?? null;

  if (liveSession === null) return null;

  return (
    <section
      data-slot="teacher-live-session-banner"
      data-sitting-id={liveSession.sitting_document_id}
      aria-labelledby="teacher-live-session-title"
      className="flex flex-col gap-3 rounded-card border border-warning/45 bg-warning-soft px-4 py-4 text-warning-ink sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6"
    >
      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <StatusPill tone="warning" className="bg-warning-ink text-warning-soft">
            <Radio aria-hidden="true" className="mr-1 size-3" />
            {t('live')}
          </StatusPill>
          <p id="teacher-live-session-title" className="text-body font-semibold">
            {t('title')}
          </p>
        </div>
        <p className="text-body-sm">
          {liveSession.class_name}
          {' · '}
          {liveSession.code === null ? t('codeMissing') : t('code', { code: liveSession.code })}
          {liveSession.opened_at === null
            ? null
            : ` · ${t('opened', {
                time: format.dateTime(new Date(liveSession.opened_at), {
                  hour: 'numeric',
                  minute: '2-digit',
                }),
              })}`}
        </p>
      </div>

      <Button
        size="lg"
        href={testSessionMonitorHref(liveSession.sitting_document_id)}
        className="shrink-0 rounded-lg"
      >
        {t('viewLive')}
        <ArrowRight aria-hidden="true" />
      </Button>
    </section>
  );
}

export { TeacherLiveSessionBanner };
