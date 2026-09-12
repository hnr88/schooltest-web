'use client';

import { useTranslations } from 'next-intl';

import type { CloseConfirmFacts, ConfirmCopy, RoomConfirm } from '@/modules/teacher/types/live-tab.types';

/** The design's confirm copy for Close sitting and the room controls, filled from the monitor. */
export function useLiveConfirmCopy() {
  const t = useTranslations('TeacherPortal.live.room');
  const tClose = useTranslations('TeacherPortal.liveSessions.closeConfirm');

  const closeCopy = (
    facts: CloseConfirmFacts | null,
    sitting: { code: string; className: string },
  ): Pick<ConfirmCopy, 'title' | 'body'> => {
    if (facts === null) {
      return { title: tClose('title'), body: tClose('body', sitting) };
    }
    const title = facts.working > 0 ? tClose('titleWorking', { count: facts.working }) : tClose('title');
    if (facts.working === 0 && facts.notJoined === 0) {
      return { title, body: t('closeConfirm.bodyNone', { code: sitting.code }) };
    }
    const names = facts.firstNames.join(', ');
    const parts = [
      facts.working > 0
        ? t('closeConfirm.bodyWorking', {
            names: facts.moreCount > 0 ? t('closeConfirm.namesMore', { names, count: facts.moreCount }) : names,
          })
        : t('closeConfirm.bodyStops', { code: sitting.code }),
      facts.offline > 0 ? t('closeConfirm.offline', { count: facts.offline }) : null,
      facts.notJoined > 0 ? t('closeConfirm.notJoined', { count: facts.notJoined }) : null,
      t('closeConfirm.undone'),
    ];
    return { title, body: parts.filter((part) => part !== null).join(' ') };
  };

  const roomCopy = (
    confirm: RoomConfirm,
    room: { working: number; code: string; extraMinutes: number },
  ): ConfirmCopy => {
    if (confirm.kind === 'pause') {
      return {
        title: t('pauseConfirm.title'),
        body: t('pauseConfirm.body', { count: room.working }),
        cta: t('pauseConfirm.cta'),
        cancel: t('pauseConfirm.cancel'),
      };
    }
    if (confirm.kind === 'nobody') {
      return {
        title: t('nobodyConfirm.title'),
        body: t('nobodyConfirm.body', { code: room.code }),
        cta: t('nobodyConfirm.cta'),
        cancel: t('nobodyConfirm.cancel'),
      };
    }
    const { minutes } = confirm;
    return {
      title: t('extendConfirm.title', { minutes }),
      body:
        room.extraMinutes > 0
          ? t('extendConfirm.bodyOnTop', { minutes, already: room.extraMinutes })
          : t('extendConfirm.body', { minutes }),
      cta: t('extendConfirm.cta', { minutes }),
      cancel: t('extendConfirm.cancel'),
    };
  };

  return { closeCopy, roomCopy };
}
