'use client';

import { useTranslations } from 'next-intl';

import { StatusPill } from '@/modules/design-system';
import type { ChildProgressResult } from '@/modules/children/types/children.types';

interface ChildSkillPendingTileProps {
  skills: NonNullable<ChildProgressResult['skill']>[];
}

// The honest counterpart to a §5.3 subject tile: the skills this child provably
// has no official result for yet. It is deliberately NOT a subject card — no
// band, no bar, no number, nothing that could be read as a result — because
// there is no result to show. It only names the skills and says so.
//
// It is rendered only when `getUnassessedSkills` could PROVE the absence (the
// returned result list was the complete set, not the API's 5-item window). When
// the list is truncated this tile does not appear at all, because "no result
// yet" would then be a guess.
//
// Dashed hairline on the card surface, not a tinted fill: it has to read as an
// open slot against the page well while still clearing 3:1 on it.
export function ChildSkillPendingTile({ skills }: ChildSkillPendingTileProps) {
  const t = useTranslations('Children');

  return (
    <div
      data-slot="child-skill-pending"
      className="flex flex-col gap-2.5 rounded-xl border border-dashed border-input bg-card px-5 py-4.5"
    >
      <span className="text-body-sm font-bold text-secondary-foreground">
        {t('skillsPendingTitle')}
      </span>
      <div className="flex flex-wrap items-center gap-1.5">
        {skills.map((skill) => (
          <StatusPill key={skill} tone="neutral">
            {t(`resultSkills.${skill}`)}
          </StatusPill>
        ))}
      </div>
      <span className="text-meta text-muted-foreground">{t('skillsPendingDescription')}</span>
    </div>
  );
}
