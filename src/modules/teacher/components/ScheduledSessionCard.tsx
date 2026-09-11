'use client';

import { useTranslations } from 'next-intl';

import { OpsConfirmDialog } from '@/modules/ops';
import { TeacherButton } from '@/modules/teacher/components/v2/TeacherButton';
import { ToneChip } from '@/modules/teacher/components/v2/ToneChip';
import { useBookingActions } from '@/modules/teacher/hooks/useBookingActions';
import { useStartSessionStore } from '@/modules/teacher/stores/use-start-session-store';
import type { LiveRollupBooking } from '@/modules/teacher/types/live-sessions.types';

// Teacher Portal v2.dc.html:272–285 — one booking: class, Today/Scheduled chip,
// the window in the school's zone, the form, who sits it, Start now (C-TS-7),
// Edit (the Start-new-session modal on this booking) and Cancel (C-TS-6).
function ScheduledSessionCard({ booking }: { booking: LiveRollupBooking }) {
  const t = useTranslations('TeacherPortal.liveSessions');
  const tKit = useTranslations('TeacherPortal.kit');
  const openStartSession = useStartSessionStore((store) => store.open);
  const { when, confirming, setConfirming, confirm, isPending } = useBookingActions(booking);
  const noValue = tKit('noValue');
  const date = when?.date ?? noValue;
  const start = when?.start ?? noValue;
  const who =
    booking.memberIds === null
      ? t('bookingWhoWhole', { count: booking.expected, className: booking.className })
      : t('bookingWhoSelected', { count: booking.memberIds.length, className: booking.className });

  return (
    <article
      data-slot="scheduled-session-card"
      data-sitting-id={booking.documentId}
      className="flex flex-col gap-2 rounded-[11px] border border-[#ECEEF2] bg-[#FAFBFC] px-[18px] py-4"
    >
      <div className="flex items-baseline justify-between gap-2.5">
        <h3 className="text-[14.5px] font-medium text-navy-900">{booking.className}</h3>
        {when ? (
          <ToneChip
            tone={when.isToday ? 'today' : 'navy'}
            size="sm"
            className="flex-none rounded-[6px] text-[12px] font-medium"
          >
            {when.isToday ? t('chipToday') : t('chipScheduled')}
          </ToneChip>
        ) : null}
      </div>
      <p data-slot="scheduled-session-when" className="text-[13.5px] font-medium text-[#374151]">
        {when ? t('when', { date: when.date, start: when.start, end: when.end }) : noValue}
      </p>
      <p className="text-[12.5px] text-[#6B7280]">{booking.formLabel ?? noValue}</p>
      <p className="text-[12.5px] text-[#6B7280]">{who}</p>
      <div className="mt-1 flex flex-wrap gap-2">
        <TeacherButton size="sm" onClick={() => setConfirming('start')}>
          {t('startNow')}
        </TeacherButton>
        <TeacherButton
          tone="secondary"
          size="sm"
          onClick={() =>
            openStartSession({ classId: booking.classDocumentId, editSittingId: booking.documentId })
          }
        >
          {t('edit')}
        </TeacherButton>
        <TeacherButton tone="ghost" size="sm" className="px-3" onClick={() => setConfirming('cancel')}>
          {t('cancelBooking')}
        </TeacherButton>
      </div>
      {confirming === null ? null : (
        <OpsConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open) setConfirming(null);
          }}
          tone={confirming === 'cancel' ? 'destructive' : 'neutral'}
          title={t(`${confirming}Confirm.title`)}
          description={
            confirming === 'start'
              ? t('startConfirm.body', { date, start })
              : t('cancelConfirm.body', { className: booking.className, date, start })
          }
          confirmLabel={t(`${confirming}Confirm.cta`)}
          cancelLabel={t(`${confirming}Confirm.cancel`)}
          pending={isPending}
          className="sm:max-w-[440px]"
          onConfirm={confirm}
        />
      )}
    </article>
  );
}

export { ScheduledSessionCard };
