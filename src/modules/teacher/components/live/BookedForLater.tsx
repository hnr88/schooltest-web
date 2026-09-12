'use client';

import { useTranslations } from 'next-intl';

import { ScheduledSessionCard } from '@/modules/teacher/components/ScheduledSessionCard';
import type { LiveRollupBooking } from '@/modules/teacher/types/live-sessions.types';

// Teacher Portal v2.dc.html:1244–1263 — this class's bookings (C-TS-2 `scheduled`),
// each card with Start now / Edit / Cancel from the Live sessions page.
function BookedForLater({ bookings }: { bookings: readonly LiveRollupBooking[] }) {
  const t = useTranslations('TeacherPortal.live.history');

  return (
    <section data-slot="live-booked" aria-labelledby="live-booked-title" className="flex flex-col gap-3">
      <h3 id="live-booked-title" className="text-[11.5px] font-semibold tracking-[0.07em] text-[#6B7280] uppercase">
        {t('bookedTitle')}
      </h3>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(290px,1fr))] gap-3.5">
        {bookings.map((booking) => (
          <ScheduledSessionCard key={booking.documentId} booking={booking} heading="test" />
        ))}
      </div>
    </section>
  );
}

export { BookedForLater };
