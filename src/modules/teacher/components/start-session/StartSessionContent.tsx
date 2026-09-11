'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { OpsDialogTitle, Skeleton } from '@/modules/design-system';
import { StartSessionBody } from '@/modules/teacher/components/start-session/StartSessionBody';
import {
  CANCEL_CLASS,
  CTA_CLASS,
  FOCUS_RING_CLASS,
} from '@/modules/teacher/constants/start-session-styles.constants';
import { useStartSessionSources } from '@/modules/teacher/hooks/useStartSessionSources';
import { resolveInitialForm } from '@/modules/teacher/lib/start-session-form';
import { addDaysIso, browserTimeZone, zonedParts } from '@/modules/teacher/lib/start-session-schedule';
import { useStartSessionStore } from '@/modules/teacher/stores/use-start-session-store';

const STATE_KEY = {
  error: 'state.loadError',
  noClasses: 'state.noClasses',
  noTests: 'state.noTests',
  bookingGone: 'state.bookingGone',
} as const;

/**
 * Waits for the teacher's real classes and tests (and, for an edit, the
 * booking), then mounts a fresh form per open (`key={openCount}`).
 */
function StartSessionContent() {
  const t = useTranslations('TeacherPortal.startSession');
  const classId = useStartSessionStore((state) => state.classId);
  const mode = useStartSessionStore((state) => state.mode);
  const tab = useStartSessionStore((state) => state.tab);
  const studentIds = useStartSessionStore((state) => state.studentIds);
  const editSittingId = useStartSessionStore((state) => state.editSittingId);
  const openCount = useStartSessionStore((state) => state.openCount);
  const close = useStartSessionStore((state) => state.close);
  const sources = useStartSessionSources(true, editSittingId);
  const status = sources.status;

  if (status === 'ready') {
    const tomorrow = addDaysIso(zonedParts(new Date(), browserTimeZone()).date, 1);
    const initial = resolveInitialForm({
      request: { classId, mode, tab, studentIds },
      classes: sources.classes,
      tests: sources.tests,
      booking: sources.booking,
      tomorrow,
    });
    return (
      <StartSessionBody key={openCount} initial={initial} classes={sources.classes} tests={sources.tests} editSittingId={editSittingId} />
    );
  }

  return (
    <div data-slot="start-session-state" data-status={status}>
      <OpsDialogTitle className="m-0 text-[21px] font-semibold text-navy-900">
        {t(editSittingId ? 'titleEdit' : 'title')}
      </OpsDialogTitle>
      {status === 'loading' ? (
        <div aria-busy="true" className="mt-5 flex flex-col gap-3">
          <Skeleton className="h-[74px] w-full rounded-[12px]" />
          <Skeleton className="h-12 w-full rounded-[12px]" />
          <Skeleton className="h-40 w-full rounded-[12px]" />
        </div>
      ) : (
        <p role={status === 'error' ? 'alert' : 'status'} className="mt-4 text-[13.5px] leading-[1.6] text-[#6B7280]">
          {t(STATE_KEY[status])}
        </p>
      )}
      <div className="mt-[26px] flex flex-wrap gap-2.5">
        {status === 'error' ? (
          <button type="button" onClick={sources.retry} className={cn(CTA_CLASS, FOCUS_RING_CLASS, 'cursor-pointer bg-navy-900 hover:bg-navy-800')}>
            {t('state.retry')}
          </button>
        ) : null}
        <button type="button" onClick={close} className={cn(CANCEL_CLASS, FOCUS_RING_CLASS)}>
          {t('state.close')}
        </button>
      </div>
    </div>
  );
}

export { StartSessionContent };
