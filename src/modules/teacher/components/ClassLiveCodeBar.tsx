'use client';

import { Copy } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { TeacherButton } from '@/modules/teacher/components/v2/TeacherButton';
import { TeacherStatusPill } from '@/modules/teacher/components/v2/TeacherStatusPill';
import { LIVE_EYEBROW_CLASS } from '@/modules/teacher/constants/live-tab.constants';
import { KIT_FOCUS_RING } from '@/modules/teacher/constants/teacher-kit-controls.constants';
import { useClassLiveCodes } from '@/modules/teacher/hooks/useClassLiveCodes';
import { useCopyCode } from '@/modules/teacher/hooks/useCopyCode';
import type { ClassLiveCodeBarProps } from '@/modules/teacher/types/results-shell.types';

/**
 * The class detail's join code, pinned. It rides INSIDE the shell's existing
 * sticky block (`CLASS_DETAIL_STICKY_CLASS`, itself `sticky top-0` in the
 * dashboard's one scroll column), so the code stays on screen on the Students,
 * Class progress, Teaching insights, Exit predictions and Family reports tabs —
 * not only on Live sessions — and "Copy code" is reachable at any time. The
 * navy card, LIVE chip and tabular-nums code are the Classes live strip's
 * drawing (`Teacher Portal v2.dc.html:73–91`); the clipboard is `useCopyCode`,
 * the one the Live tab's JoinCodeCell uses.
 *
 * MORE THAN ONE LIVE SITTING: the bar shows the ACTIVE one large with the copy
 * button, and lists every live sitting as a chip (test + its own code) that
 * makes itself active. "Active" is `?session=`, the same URL param the Live tab
 * reads, so picking a code here also picks the sitting the Live tab opens on.
 * Nothing is drawn when the class has no live sitting.
 */
function ClassLiveCodeBar({ classDocumentId, sessionId, onSelectSitting }: ClassLiveCodeBarProps) {
  const t = useTranslations('TeacherPortal.classDetail.liveCode');
  const tRoom = useTranslations('TeacherPortal.live.room');
  const tKit = useTranslations('TeacherPortal.kit');
  const { sittings, active } = useClassLiveCodes(classDocumentId, sessionId);
  const { copied, copy } = useCopyCode(active?.code ?? null);

  if (active === null) return null;

  return (
    <section
      data-slot="class-live-code-bar"
      data-sitting-id={active.sittingId}
      aria-label={t('label')}
      className="flex flex-wrap items-center gap-x-3.5 gap-y-2.5 rounded-[10px] border border-navy-900 bg-navy-900 px-4 py-3"
    >
      <TeacherStatusPill status="live" size="xs" className="flex-none" />
      <span className="flex items-baseline gap-2.5">
        <span className={cn('flex-none text-[#9FB3D9]', LIVE_EYEBROW_CLASS)}>
          {tRoom('joinCode')}
        </span>
        <span
          data-slot="class-live-code"
          className="text-[22px] leading-none font-bold tracking-[0.06em] whitespace-nowrap text-white tabular-nums"
        >
          {active.code ?? tKit('noValue')}
        </span>
      </span>
      {active.testLabel === null ? null : (
        <span className="min-w-0 truncate text-[12.5px] text-[#B9C6DD]" title={active.testLabel}>
          {active.testLabel}
        </span>
      )}
      <TeacherButton
        tone="inverse"
        size="sm"
        data-slot="class-live-copy"
        className="ms-auto flex-none"
        disabled={active.code === null}
        onClick={copy}
      >
        <Copy aria-hidden="true" className="size-[15px]" strokeWidth={1.9} />
        {copied ? tRoom('copied') : tRoom('copy')}
      </TeacherButton>
      {sittings.length > 1 ? (
        <span
          role="group"
          aria-label={t('others')}
          data-slot="class-live-code-switch"
          className="flex w-full flex-wrap gap-1.5"
        >
          {sittings.map((sitting) => (
            <button
              key={sitting.sittingId}
              type="button"
              data-sitting-id={sitting.sittingId}
              aria-pressed={sitting.sittingId === active.sittingId}
              title={t('select', { test: sitting.testLabel ?? tKit('noValue') })}
              onClick={() => onSelectSitting(sitting.sittingId)}
              className={cn(
                'flex max-w-full items-baseline gap-2 rounded-[7px] border px-2.5 py-1 text-[12px] transition-colors motion-reduce:transition-none',
                KIT_FOCUS_RING,
                sitting.sittingId === active.sittingId
                  ? 'border-white/70 bg-white/15 text-white'
                  : 'border-white/20 text-[#B9C6DD] hover:bg-white/10',
              )}
            >
              <span className="truncate">{sitting.testLabel ?? tKit('noValue')}</span>
              <span className="flex-none font-semibold tracking-[0.04em] tabular-nums">
                {sitting.code ?? tKit('noValue')}
              </span>
            </button>
          ))}
        </span>
      ) : null}
    </section>
  );
}

export { ClassLiveCodeBar };
