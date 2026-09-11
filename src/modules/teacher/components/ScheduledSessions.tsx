'use client';

import { useTranslations } from 'next-intl';

import { ScheduledSessionCard } from '@/modules/teacher/components/ScheduledSessionCard';
import { TeacherButton } from '@/modules/teacher/components/v2/TeacherButton';
import type { LiveRollupBooking } from '@/modules/teacher/types/live-sessions.types';

// Teacher Portal v2.dc.html:267–287 — the teacher's bookings, soonest first (the
// server sorts them by `window.opens_at`).
function ScheduledSessions({
  bookings,
  isError,
  onRetry,
}: {
  bookings: readonly LiveRollupBooking[];
  isError: boolean;
  onRetry: () => void;
}) {
  const t = useTranslations('TeacherPortal.liveSessions');

  return (
    <section
      data-slot="teacher-scheduled-sessions"
      data-status={isError ? 'error' : 'ready'}
      aria-labelledby="live-sessions-scheduled"
      className="flex flex-col gap-3 border-t border-[#ECEEF2] px-8 py-[22px]"
    >
      <h2
        id="live-sessions-scheduled"
        className="text-[11px] font-medium tracking-[0.07em] text-[#6B7280] uppercase"
      >
        {isError ? t('scheduledTitle') : t('scheduledLabel', { count: bookings.length })}
      </h2>
      {isError ? (
        <div role="alert" className="flex flex-wrap items-center gap-3 text-[13px] text-[#6B7280]">
          {t('bookingsError')}
          <TeacherButton tone="secondary" size="xs" onClick={onRetry}>
            {t('retry')}
          </TeacherButton>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-3">
          {bookings.map((booking) => (
            <ScheduledSessionCard key={booking.documentId} booking={booking} />
          ))}
        </div>
      )}
    </section>
  );
}

export { ScheduledSessions };
