'use client';

import { Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { cn } from '@/lib/utils';
import { SKILL_SCOPE_ORDER, isSkillLive } from '@/modules/teacher/lib/skill-scope';
import type { ComingSoonPanelProps } from '@/modules/teacher/types/results-shell.types';

/**
 * The ONE coming-soon body, two scopes: the class shell (S06a, `Teacher Portal
 * v2` `:641–661`) and the student page (S04d, task 15) — never a second body.
 * Title and description come from the caller, because the design words the two
 * scopes differently; the icon tile, the layout and (class scope only) the four
 * skill status chips are shared.
 *
 * It ships WITHOUT the notify-me confirmation ([D-12]): `api::push-subscription`
 * is web-push transport, not a launch-interest list, and a confirmation that
 * records nothing is a lie (OP-2). The panel carries no control at all.
 *
 * Teacher v2 kit member (re-exported from `components/v2`): a 60px r16 #F1F3F6
 * clock tile, 22px/600 title, 14px/1.65 grey body held to 52ch, 12.5px chips.
 */
function ComingSoonPanel({
  title,
  description,
  showSkillChips = false,
  className,
}: ComingSoonPanelProps) {
  const t = useTranslations('Teacher.results.skills');
  const headingId = useId();

  return (
    <section
      data-slot="coming-soon-panel"
      aria-labelledby={headingId}
      className={cn('flex flex-col items-center gap-[18px] px-6 pt-11 pb-5 text-center', className)}
    >
      <div className="grid size-15 place-items-center rounded-[16px] bg-[#F1F3F6]">
        <Clock aria-hidden="true" className="size-[26px] text-[#5B6472]" strokeWidth={1.8} />
      </div>
      <div className="max-w-[52ch]">
        <h2 id={headingId} className="text-[22px] font-semibold tracking-[-0.02em] text-navy-900">
          {title}
        </h2>
        <p className="mt-2.5 text-[14px] leading-[1.65] text-[#6B7280]">{description}</p>
      </div>
      {showSkillChips ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {SKILL_SCOPE_ORDER.map((skill) =>
            isSkillLive(skill) ? (
              <span
                key={skill}
                data-slot="skill-status-chip"
                data-skill={skill}
                data-state="live"
                className="inline-flex items-center gap-[7px] rounded-full bg-[#E9F6EF] px-3 py-[5px] text-[12.5px] font-semibold text-[#1F7A4D]"
              >
                <span aria-hidden="true" className="size-1.5 rounded-full bg-[#1F7A4D]" />
                {t('liveChip', { skill: t(skill) })}
              </span>
            ) : (
              <span
                key={skill}
                data-slot="skill-status-chip"
                data-skill={skill}
                data-state="soon"
                className="inline-flex items-center rounded-full bg-[#F1F3F6] px-3 py-[5px] text-[12.5px] font-semibold text-[#5B6472]"
              >
                {t('soonChip', { skill: t(skill) })}
              </span>
            ),
          )}
        </div>
      ) : null}
    </section>
  );
}

export { ComingSoonPanel };
