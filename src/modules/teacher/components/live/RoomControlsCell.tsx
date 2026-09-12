'use client';

import { Pause, Play } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { OpsConfirmDialog } from '@/modules/ops';
import { TeacherButton } from '@/modules/teacher/components/v2/TeacherButton';
import { LIVE_EYEBROW_CLASS, ROOM_EXTEND_MINUTES } from '@/modules/teacher/constants/live-tab.constants';
import { useLiveConfirmCopy } from '@/modules/teacher/hooks/useLiveConfirmCopy';
import { useRoomControls } from '@/modules/teacher/hooks/useRoomControls';
import { clockLabel, workingStudents } from '@/modules/teacher/lib/live-tab';
import type {
  TeacherTestSession,
  TestSessionMonitorResponse,
} from '@/modules/teacher/types/teacher-session.types';

// Teacher Portal v2.dc.html:1096–1111 — Pause test / Resume test and +5 / +10 min on
// the room endpoints (B2); the room's pause, extra time and extensions are the monitor's.
function RoomControlsCell({
  sitting,
  monitor,
}: {
  sitting: TeacherTestSession;
  monitor: TestSessionMonitorResponse | null;
}) {
  const t = useTranslations('TeacherPortal.live.room');
  const tKit = useTranslations('TeacherPortal.kit');
  const locale = useLocale();
  const controls = useRoomControls(sitting.sitting_document_id, monitor);
  const { roomCopy } = useLiveConfirmCopy();
  const { room, confirm } = controls;
  const paused = room !== null && room.paused;
  const copy =
    confirm === null
      ? null
      : roomCopy(confirm, {
          working: workingStudents(monitor?.students ?? []).length,
          code: sitting.code ?? tKit('noValue'),
          extraMinutes: room?.extraMinutes ?? 0,
        });

  return (
    <div
      data-slot="room-controls"
      data-paused={paused}
      className={cn('flex flex-col px-6 py-[22px]', paused ? 'bg-[#FDF3E0]' : 'bg-white')}
    >
      <div className="flex items-center gap-[9px]">
        <span className={LIVE_EYEBROW_CLASS}>{t('controls')}</span>
        <span
          aria-hidden="true"
          className={cn('size-[7px] flex-none rounded-full', paused ? 'bg-[#92610B]' : 'bg-[#1F7A4D]')}
        />
      </div>
      {room !== null && room.paused && room.pausedAt !== null ? (
        <p data-slot="room-paused-at" className="mt-2.5 text-[13px] font-semibold text-[#92610B]">
          {t('pausedAt', { time: clockLabel(room.pausedAt, locale) })}
        </p>
      ) : null}
      <p
        data-slot="room-meta"
        className={cn('mt-2.5 text-[13px] leading-normal', paused ? 'text-[#92610B]' : 'text-[#6B7280]')}
      >
        {paused ? t('metaPaused') : t('metaRunning')}
        {room !== null && room.extensions > 0
          ? ` ${t('extraSoFar', { minutes: room.extraMinutes, count: room.extensions })}`
          : null}
      </p>
      <div className="mt-auto flex flex-wrap items-center gap-2.5 pt-4">
        <TeacherButton
          size="xl"
          data-slot="room-toggle"
          className={paused ? 'bg-[#1F7A4D] hover:bg-[#18643F]' : undefined}
          disabled={room === null || controls.isPending}
          onClick={controls.onToggle}
        >
          {paused ? (
            <Play aria-hidden="true" className="size-[15px]" fill="currentColor" />
          ) : (
            <Pause aria-hidden="true" className="size-[15px]" fill="currentColor" />
          )}
          {paused ? t('resume') : t('pause')}
        </TeacherButton>
        {ROOM_EXTEND_MINUTES.map((minutes) => (
          <TeacherButton
            key={minutes}
            tone="outline"
            size="xl"
            className="border-[#D8DFEA] px-3.5"
            disabled={room === null || controls.isPending}
            onClick={() => controls.onExtend(minutes)}
          >
            {t('extend', { minutes })}
          </TeacherButton>
        ))}
      </div>
      {copy === null ? null : (
        <OpsConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open) controls.onCancel();
          }}
          title={copy.title}
          description={copy.body}
          confirmLabel={copy.cta}
          cancelLabel={copy.cancel}
          pending={controls.isPending}
          skin="teacher"
          onConfirm={controls.onConfirm}
        />
      )}
    </div>
  );
}

export { RoomControlsCell };
