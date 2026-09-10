'use client';

import { ArrowRight, Radio } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { Button, StatusPill } from '@/modules/design-system';
import { testSessionMonitorHref } from '@/modules/teacher/lib/join-code';
import { useTeacherDashboardQuery } from '@/modules/teacher/queries/use-teacher-dashboard.query';
import type { DashboardLiveSession } from '@/modules/teacher/types/teacher.types';

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
//
// teacher/06 — the component is no longer one-of-one: given a `session`, it
// renders the live strip's navy card instead (Teacher Portal v2.dc.html:77–88),
// one per entry of the ADDITIVE `live_sessions[]`, linking to that sitting's
// monitor. The no-prop dashboard render is frozen byte-for-byte: `live_session`
// keeps its exact meaning and nullability, so its current single-sitting render
// never breaks.
export interface TeacherLiveSessionBannerProps {
  /** A strip entry from `live_sessions[]`; omit for the dashboard's banner. */
  session?: DashboardLiveSession;
  /** The sitting's C-TD-2 label, resolved by the strip (never from the letter). */
  testLabel?: string | null;
}

function TeacherLiveSessionBanner({ session, testLabel }: TeacherLiveSessionBannerProps) {
  const t = useTranslations('Teacher.dashboard.liveBanner');
  const tStrip = useTranslations('Teacher.results.list');
  const format = useFormatter();
  const dashboard = useTeacherDashboardQuery();
  const liveSession = session ?? dashboard.data?.live_session ?? null;

  if (liveSession === null) return null;

  if (session !== undefined) {
    // The strip card (design :77–88): navy, LIVE pill with a pulsing dot, the
    // class, the code and the test, the WHOLE card linking to that monitor.
    return (
      <Link
        href={testSessionMonitorHref(liveSession.sitting_document_id)}
        data-slot="live-strip-card"
        data-sitting-id={liveSession.sitting_document_id}
        className="flex max-w-[340px] items-center gap-3.5 rounded-xl border border-primary bg-primary p-3.5 text-primary-foreground transition-colors duration-200 ease-out hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none motion-reduce:transition-none"
      >
        <StatusPill tone="danger" className="shrink-0 bg-destructive tracking-widest text-white">
          <span
            aria-hidden="true"
            className="mr-1 size-1.5 animate-pulse rounded-full bg-white motion-reduce:animate-none"
          />
          {tStrip('live')}
        </StatusPill>
        <span className="flex min-w-0 flex-col">
          <span className="flex items-baseline gap-2">
            <span className="text-sm font-semibold">{liveSession.class_name}</span>
            <span className="text-xs font-medium tracking-wide text-primary-foreground/60 tabular-nums">
              {liveSession.code === null ? t('codeMissing') : liveSession.code}
            </span>
          </span>
          {testLabel === null || testLabel === undefined ? null : (
            <span className="mt-0.5 truncate text-xs text-primary-foreground/70">
              {testLabel}
            </span>
          )}
        </span>
      </Link>
    );
  }

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
