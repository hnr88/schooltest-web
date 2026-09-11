'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/modules/design-system';
import {
  SKILL_TAB_CLASS,
  SKILL_TAB_ICONS,
  SKILL_TAB_TONES,
} from '@/modules/teacher/constants/results.constants';
import {
  SKILL_SCOPE_ORDER,
  isSkillLive,
  isSkillScopeValue,
} from '@/modules/teacher/lib/skill-scope';
import type { SkillScopeValue } from '@/modules/teacher/types/results-shell.types';

/**
 * The four skill cards of the class detail (`Teacher Portal v2.dc.html:598–630`):
 * Reading is live, the other three carry a Soon chip — and every card stays
 * clickable, because choosing a Soon skill is how a teacher SEES the coming-soon
 * panel. On the repo tab primitive, so the tablist/tab roles, the roving
 * tabindex and Arrow/Home/End are the primitive's, not hand-rolled ARIA.
 */
function SkillTabs({
  value,
  onValueChange,
}: {
  value: SkillScopeValue;
  onValueChange: (next: SkillScopeValue) => void;
}) {
  const t = useTranslations('TeacherPortal.classDetail');

  return (
    <Tabs
      value={value}
      onValueChange={(next) => {
        if (isSkillScopeValue(next)) onValueChange(next);
      }}
      className="gap-0"
    >
      <TabsList
        variant="default"
        aria-label={t('skillsLabel')}
        className="h-auto w-full flex-wrap items-stretch justify-start gap-2 rounded-none bg-transparent p-0 group-data-horizontal/tabs:h-auto"
      >
        {SKILL_SCOPE_ORDER.map((skill) => {
          const Icon = SKILL_TAB_ICONS[skill];
          const live = isSkillLive(skill);
          const tone =
            value === skill ? SKILL_TAB_TONES.selected : live ? SKILL_TAB_TONES.live : SKILL_TAB_TONES.soon;
          return (
            <TabsTrigger key={skill} value={skill} data-skill={skill} className={cn(SKILL_TAB_CLASS, tone.root)}>
              <Icon aria-hidden="true" className={cn('size-[18px] flex-none', tone.icon)} strokeWidth={1.8} />
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-semibold">{t(`skills.${skill}`)}</span>
                <span className={cn('block text-[11px] font-medium', tone.sub)}>
                  {live ? t('liveNow') : t('comingSoon')}
                </span>
              </span>
              {live ? null : (
                <span
                  className={cn(
                    'flex-none rounded-full px-[7px] py-0.5 text-[9.5px] font-bold tracking-[0.06em] uppercase',
                    tone.chip,
                  )}
                >
                  {t('soon')}
                </span>
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}

export { SkillTabs };
