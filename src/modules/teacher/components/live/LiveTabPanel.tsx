'use client';

import { useTranslations } from 'next-intl';

import { Skeleton } from '@/components/ui/skeleton';
import { BookedForLater } from '@/modules/teacher/components/live/BookedForLater';
import { ConnectionAccordion } from '@/modules/teacher/components/live/ConnectionAccordion';
import { LiveActivityCard } from '@/modules/teacher/components/live/LiveActivityCard';
import { LiveStudentsSection } from '@/modules/teacher/components/live/LiveStudentsSection';
import { NoSittingCard } from '@/modules/teacher/components/live/NoSittingCard';
import { PreviousSessions } from '@/modules/teacher/components/live/PreviousSessions';
import { RunSittingCard } from '@/modules/teacher/components/live/RunSittingCard';
import { TeacherButton } from '@/modules/teacher/components/v2/TeacherButton';
import { useLiveTab } from '@/modules/teacher/hooks/useLiveTab';

// Teacher Portal v2.dc.html:1022–1291 — the class's "Test day" tab on live reads:
// the selected sitting's Run the sitting card, connection, students (S7b's
// section), activity, then bookings and previous sessions; "No sitting open"
// when nothing is live. `data-surface="teacher-test-day"` is kept for the specs.
// The root carries `leading-[normal]` (P1 round 2 · N4) like every other teacher tab
// panel: `TabsContent`'s `text-sm` otherwise forces a 20px line-height on every line here.
function LiveTabPanel({ classDocumentId, sessionId }: { classDocumentId: string; sessionId: string | null }) {
  const t = useTranslations('TeacherPortal.live.header');
  const tKit = useTranslations('TeacherPortal.kit');
  const live = useLiveTab(classDocumentId, sessionId);
  const { sitting, klass } = live;
  const ready = live.status === 'ready';
  const subtitle =
    sitting !== null
      ? t('subtitleLive', {
          className: sitting.class.name,
          test: sitting.form?.label ?? tKit('noValue'),
          count: sitting.stats?.expected ?? sitting.expected,
        })
      : klass === null
        ? null
        : klass.yearLevel === null
          ? t('subtitleIdleNoYear', { className: klass.name, count: klass.studentCount })
          : t('subtitleIdle', { className: klass.name, count: klass.studentCount, year: klass.yearLevel });
  // P1 round 2 · N3 — when to draw the "Previous sessions" block. The design hangs it on
  // `live.blockDisplay` (`:1265`) = `liveBlank ? 'none' : 'block'` (`:4060`), and
  // `liveBlank = !sitOpen && !classSessions.length && !schedList(sel.name).length
  // && !this.sitting.past.some(...)` (`:3731`): the block goes ONLY when the class has
  // nothing at all — no open sitting, no booking, no sitting that ever ran. That is the
  // condition below, so the tab already follows the design's rule. The design shot
  // `class-detail-complete--live` carries no block because its sample class has no past
  // sittings, which is DATA (RULE 0), not a rule that a class without a live sitting hides
  // its history — every real class with a Complete status has closed sittings.
  const showHistory = sitting !== null || live.bookings.length > 0 || live.history.length > 0 || live.historyError;

  return (
    <div
      data-slot="live-tab"
      data-surface="teacher-test-day"
      data-status={live.status}
      data-sitting-id={sitting?.sitting_document_id}
      className="flex flex-col gap-[18px] leading-[normal]"
    >
      <div>
        <h2 className="text-[20px] font-semibold text-navy-900">{t('title')}</h2>
        {subtitle === null ? null : (
          <p data-slot="live-subtitle" className="mt-1.5 text-[13.5px] text-[#6B7280]">
            {subtitle}
          </p>
        )}
      </div>
      {live.status === 'loading' ? (
        <div role="status" aria-label={t('loading')} className="flex flex-col gap-[18px]">
          <Skeleton className="h-[296px] w-full rounded-[14px]" />
          <Skeleton className="h-[54px] w-full rounded-[11px]" />
        </div>
      ) : null}
      {live.status === 'error' ? (
        <div role="alert" className="flex flex-wrap items-center gap-3 text-[13.5px] text-[#B42318]">
          {t('loadError')}
          <TeacherButton tone="secondary" size="xs" onClick={live.retry}>
            {t('retry')}
          </TeacherButton>
        </div>
      ) : null}
      {ready && sitting === null ? <NoSittingCard classDocumentId={classDocumentId} /> : null}
      {ready && sitting !== null ? (
        <>
          <RunSittingCard
            key={sitting.sitting_document_id}
            sitting={sitting}
            monitor={live.monitor}
            settings={live.settings}
          />
          <ConnectionAccordion
            sittingDocumentId={sitting.sitting_document_id}
            monitor={live.monitor}
            settings={live.settings}
          />
          <LiveStudentsSection
            key={`students-${sitting.sitting_document_id}`}
            sittingId={sitting.sitting_document_id}
            classDocumentId={classDocumentId}
            afterBoard={<LiveActivityCard sittingDocumentId={sitting.sitting_document_id} />}
          />
        </>
      ) : null}
      {ready && live.bookings.length > 0 ? <BookedForLater bookings={live.bookings} /> : null}
      {ready && showHistory ? (
        <PreviousSessions rows={live.history} truncated={live.historyTruncated} isError={live.historyError} />
      ) : null}
    </div>
  );
}

export { LiveTabPanel };
