'use client';

import { useId } from 'react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { TeacherStatusPill } from '@/modules/teacher/components/v2/TeacherStatusPill';
import { KIT_FOCUS_RING } from '@/modules/teacher/constants/teacher-kit-controls.constants';
import type { ClassesLiveStripProps } from '@/modules/teacher/types/classes-screen.types';

/**
 * The Classes screen's live strip (`Teacher Portal v2.dc.html:73–91`): the
 * "N SESSIONS LIVE NOW ●" eyebrow, then one navy card per open sitting of
 * `live_sessions[]` — LIVE chip, class, the real join code, the test when the
 * sitting names one. Each card opens its class on the Live sessions tab.
 */
function ClassesLiveStrip({ cards }: ClassesLiveStripProps) {
  const t = useTranslations('TeacherPortal.classes');
  const tKit = useTranslations('TeacherPortal.kit');
  const labelId = useId();

  return (
    <section
      data-slot="live-strip"
      aria-labelledby={labelId}
      className="flex flex-col gap-2.5 px-8 pb-[22px]"
    >
      <p
        id={labelId}
        data-slot="live-strip-label"
        className="flex items-center gap-2 text-[11.5px] font-medium tracking-[0.06em] text-[#6B7280] uppercase"
      >
        {t('liveStrip', { count: cards.length })}
        <span aria-hidden="true" className="size-1.5 animate-om-pulse-slow rounded-full bg-[#DC2626]" />
      </p>
      <div className="flex flex-wrap gap-2.5">
        {cards.map((card) => (
          <Link
            key={card.sittingId}
            href={card.href}
            data-slot="live-strip-card"
            data-sitting-id={card.sittingId}
            className={cn(
              'flex max-w-[374px] flex-[0_1_auto] items-center gap-3.5 rounded-[10px] border border-navy-900 bg-navy-900 px-4 py-3.5 transition-colors hover:bg-navy-800 motion-reduce:transition-none',
              KIT_FOCUS_RING,
            )}
          >
            <TeacherStatusPill status="live" size="xs" className="flex-none" />
            <span className="min-w-0">
              <span className="flex items-baseline gap-2">
                <span className="text-[14px] font-semibold text-white">{card.className}</span>
                <span className="text-[12px] font-medium tracking-[0.04em] text-[#9FB3D9] tabular-nums">
                  {card.code ?? tKit('noValue')}
                </span>
              </span>
              {card.testLabel === null ? null : (
                <span className="mt-0.5 block truncate text-[12px] text-[#B9C6DD]">{card.testLabel}</span>
              )}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export { ClassesLiveStrip };
