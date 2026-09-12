'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { OpsConfirmDialog } from '@/modules/ops';
import { TeacherButton } from '@/modules/teacher/components/v2/TeacherButton';
import { ToneChip } from '@/modules/teacher/components/v2/ToneChip';
import { useBookingActions } from '@/modules/teacher/hooks/useBookingActions';
import { useStartSessionStore } from '@/modules/teacher/stores/use-start-session-store';
import type { LiveRollupBooking } from '@/modules/teacher/types/live-sessions.types';

/**
 * The design draws this booking twice, and not identically (P1 round 2 · N2).
 * `page` is the Live sessions list card (`:272–285`): class name at 14.5/500, a
 * r6 chip at 3/9, the window in `#374151`, h34/r9 13/500 buttons and a quiet
 * `Cancel`. `live` is the class Live tab's own card (`:1244–1263`): the test is
 * the title at 14.5/600, the chip is a 4/11 pill, the window is 13.5/600
 * `#4B5563`, the buttons are h36/r8 13/600 and `Cancel` keeps the destructive
 * `#B42318` on `#E9C4C0` the page card drops. Every value here is the design's.
 */
const CARD_VARIANTS = {
  page: {
    root: 'gap-2 px-[18px] py-4',
    title: 'font-medium',
    chip: 'flex-none rounded-[6px] text-[12px] font-medium',
    when: 'font-medium text-[#374151]',
    actions: 'mt-1',
    button: '',
    editTone: 'secondary',
    cancelTone: 'ghost',
    cancelClass: 'px-3',
  },
  live: {
    root: 'gap-2.5 px-5 py-[18px]',
    title: 'font-semibold',
    chip: 'flex-none rounded-full px-[11px] py-1 text-[12px] font-semibold',
    when: 'font-semibold text-[#4B5563]',
    actions: 'mt-0.5',
    button: 'h-9 rounded-[8px] font-semibold',
    editTone: 'outline',
    cancelTone: 'dangerOutline',
    cancelClass: '',
  },
} as const;

// Teacher Portal v2.dc.html:272–285 (`page`) / :1244–1263 (`live`) — one booking:
// class or test, Today/Scheduled chip, the window in the school's zone, the form,
// who sits it, Start now (C-TS-7), Edit (the Start-new-session modal on this
// booking) and Cancel (C-TS-6).
function ScheduledSessionCard({
  booking,
  variant = 'page',
}: {
  booking: LiveRollupBooking;
  variant?: 'page' | 'live';
}) {
  const t = useTranslations('TeacherPortal.liveSessions');
  const tKit = useTranslations('TeacherPortal.kit');
  const openStartSession = useStartSessionStore((store) => store.open);
  const { when, confirming, setConfirming, confirm, isPending } = useBookingActions(booking);
  const skin = CARD_VARIANTS[variant];
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
      className={cn('flex flex-col rounded-[11px] border border-[#ECEEF2] bg-[#FAFBFC]', skin.root)}
    >
      <div className="flex items-baseline justify-between gap-2.5">
        <h3 className={cn('text-[14.5px] text-navy-900', skin.title)}>
          {variant === 'live' ? (booking.formLabel ?? noValue) : booking.className}
        </h3>
        {when ? (
          <ToneChip tone={when.isToday ? 'today' : 'navy'} size="sm" className={skin.chip}>
            {when.isToday ? t('chipToday') : t('chipScheduled')}
          </ToneChip>
        ) : null}
      </div>
      <p data-slot="scheduled-session-when" className={cn('text-[13.5px]', skin.when)}>
        {when ? t('when', { date: when.date, start: when.start, end: when.end }) : noValue}
      </p>
      {variant === 'live' ? null : (
        <p className="text-[12.5px] text-[#6B7280]">{booking.formLabel ?? noValue}</p>
      )}
      <p className="text-[12.5px] text-[#6B7280]">{who}</p>
      <div className={cn('flex flex-wrap gap-2', skin.actions)}>
        <TeacherButton size="sm" className={skin.button} onClick={() => setConfirming('start')}>
          {t('startNow')}
        </TeacherButton>
        <TeacherButton
          tone={skin.editTone}
          size="sm"
          className={skin.button}
          onClick={() =>
            openStartSession({ classId: booking.classDocumentId, editSittingId: booking.documentId })
          }
        >
          {t('edit')}
        </TeacherButton>
        <TeacherButton
          tone={skin.cancelTone}
          size="sm"
          className={cn(skin.button, skin.cancelClass)}
          onClick={() => setConfirming('cancel')}
        >
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
          skin="teacher"
          onConfirm={confirm}
        />
      )}
    </article>
  );
}

export { ScheduledSessionCard };
