'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { showOpsToast } from '@/modules/ops/actions';
import { CONTROL_FAILURE_KEY } from '@/modules/teacher/constants/live-tab.constants';
import { controlFailure, hasPausable, roomState } from '@/modules/teacher/lib/live-tab';
import { useRoomControlMutation } from '@/modules/test-day';
import type { RoomConfirm, RoomControlsState } from '@/modules/teacher/types/live-tab.types';
import type { TestSessionMonitorResponse } from '@/modules/teacher/types/teacher-session.types';

/**
 * The room controls behind their confirms (design `live.roomToggle` / `extendOpts`):
 * Resume acts at once; Pause asks first, or says nobody is left to pause; +5 / +10
 * asks first. A refusal closes the confirm and says why — the monitor then shows the room as it is.
 */
export function useRoomControls(
  sittingDocumentId: string,
  monitor: TestSessionMonitorResponse | null,
): RoomControlsState {
  const t = useTranslations('TeacherPortal.live.room.errors');
  const control = useRoomControlMutation();
  const [confirm, setConfirm] = useState<RoomConfirm | null>(null);
  const room = monitor === null ? null : roomState(monitor.sitting);

  const settle = {
    onSuccess: () => setConfirm(null),
    onError: (error: unknown) => {
      setConfirm(null);
      showOpsToast({ tone: 'error', message: t(CONTROL_FAILURE_KEY[controlFailure(error)]) });
    },
  };

  return {
    room,
    confirm,
    isPending: control.isPending,
    onToggle: () => {
      if (room === null || monitor === null) return;
      if (room.paused) {
        control.mutate({ sittingDocumentId, action: 'resume' }, settle);
        return;
      }
      setConfirm(hasPausable(monitor.students) ? { kind: 'pause' } : { kind: 'nobody' });
    },
    onExtend: (minutes) => setConfirm({ kind: 'extend', minutes }),
    onConfirm: () => {
      if (confirm?.kind === 'pause') control.mutate({ sittingDocumentId, action: 'pause' }, settle);
      else if (confirm?.kind === 'extend')
        control.mutate({ sittingDocumentId, action: 'extend', minutes: confirm.minutes }, settle);
      else setConfirm(null);
    },
    onCancel: () => setConfirm(null),
  };
}
