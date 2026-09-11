'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { useRouter } from '@/i18n/navigation';
import { showOpsToast } from '@/modules/ops/actions';
import { bookingWindowView } from '@/modules/teacher/lib/booking-window';
import { liveTabHref } from '@/modules/teacher/lib/live-rollup';
import { useCancelTestSessionMutation } from '@/modules/teacher/queries/use-cancel-test-session.mutation';
import { useStartTestSessionMutation } from '@/modules/teacher/queries/use-start-test-session.mutation';
import type { LiveRollupBooking } from '@/modules/teacher/types/live-sessions.types';

/**
 * A booking card's two actions behind their confirms: Start now (C-TS-7) opens
 * the started sitting on its class's Live tab; Cancel (C-TS-6) drops the
 * booking. Both mutations refresh the lists; a refusal keeps the dialog open.
 */
export function useBookingActions(booking: LiveRollupBooking) {
  const t = useTranslations('TeacherPortal.liveSessions');
  const tKit = useTranslations('TeacherPortal.kit');
  const locale = useLocale();
  const router = useRouter();
  const start = useStartTestSessionMutation();
  const cancel = useCancelTestSessionMutation();
  const [confirming, setConfirming] = useState<'start' | 'cancel' | null>(null);
  const when =
    booking.window === null ? null : bookingWindowView(booking.window, locale, new Date());
  const slot = {
    className: booking.className,
    date: when?.date ?? tKit('noValue'),
    start: when?.start ?? tKit('noValue'),
  };

  const confirm = () => {
    if (confirming === 'start') {
      start.mutate(booking.documentId, {
        onSuccess: (started) => {
          setConfirming(null);
          showOpsToast({ tone: 'ok', message: t('startedToast', slot) });
          router.push(liveTabHref(started.class.document_id, started.sitting_document_id));
        },
        onError: () => showOpsToast({ tone: 'error', message: t('startError') }),
      });
    } else if (confirming === 'cancel') {
      cancel.mutate(booking.documentId, {
        onSuccess: () => {
          setConfirming(null);
          showOpsToast({ tone: 'ok', message: t('cancelledToast', slot) });
        },
        onError: () => showOpsToast({ tone: 'error', message: t('cancelError') }),
      });
    }
  };

  return {
    when,
    confirming,
    setConfirming,
    confirm,
    isPending: start.isPending || cancel.isPending,
  };
}
