'use client';

import { BookOpen, Headphones, Mic, PenLine } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Tabs, TabsList, TabsTrigger } from '@/modules/design-system';
import { SKILL_SCOPE_ORDER, isSkillLive } from '@/modules/teacher/lib/skill-scope';
import type { SkillScopeValue } from '@/modules/teacher/types/results-shell.types';
import type { LucideIcon } from 'lucide-react';

/** The design chip's icon, fixed per skill (`:606–630`). */
const SKILL_ICONS: Record<SkillScopeValue, LucideIcon> = {
  reading: BookOpen,
  listening: Headphones,
  writing: PenLine,
  speaking: Mic,
};

/**
 * The four skill chips of the class shell (`Teacher Portal v2:601–638`):
 * Reading is live, the other three carry a Soon badge — and every chip stays
 * clickable, because choosing a Soon skill is how a teacher SEES the
 * coming-soon panel (logic.md #sm-skill). On the repo tab primitive, so the
 * tablist/tab roles, the roving tabindex and the Arrow/Home/End model are the
 * primitive's, not hand-rolled ARIA — the same shape `ClassResultsTabs` uses,
 * never `UnderlineTabs` (it renders a list only and cannot carry a body).
 */
function SkillTabs({
  value,
  onValueChange,
}: {
  value: SkillScopeValue;
  onValueChange: (next: SkillScopeValue) => void;
}) {
  const t = useTranslations('Teacher.results.skills');
  const tTabs = useTranslations('Teacher.results.tabs');

  return (
    <Tabs value={value} onValueChange={onValueChange} className="gap-0">
      <TabsList
        variant="default"
        aria-label={t('listLabel')}
        className="w-full flex-wrap gap-2 rounded-none bg-transparent p-0 group-data-horizontal/tabs:h-auto"
      >
        {SKILL_SCOPE_ORDER.map((skill) => {
          const Icon = SKILL_ICONS[skill];
          const live = isSkillLive(skill);
          const selected = value === skill;
          return (
            <TabsTrigger
              key={skill}
              value={skill}
              data-skill={skill}
              className={`h-auto min-h-11 basis-37 flex-1 justify-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-left font-semibold shadow-none data-active:shadow-none ${
                selected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-foreground'
              }`}
            >
              <Icon
                aria-hidden="true"
                className={`size-4.5 flex-none ${live || selected ? '' : 'opacity-55'}`}
                strokeWidth={1.8}
              />
              <span className="min-w-0 flex-1">
                <span className="block text-body-sm">{t(skill)}</span>
                <span
                  className={`block text-meta font-medium ${
                    selected
                      ? 'text-primary-foreground/70'
                      : live
                        ? 'text-success-strong'
                        : 'text-muted-foreground'
                  }`}
                >
                  {live ? t('liveNow') : tTabs('comingSoon')}
                </span>
              </span>
              {live ? null : (
                <span
                  className={`flex-none rounded-full px-1.5 py-0.5 text-micro font-bold tracking-wider uppercase ${
                    selected
                      ? 'bg-surface-glass text-primary-foreground'
                      : 'bg-surface-inset text-muted-foreground'
                  }`}
                >
                  {t('soonBadge')}
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
