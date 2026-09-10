'use client';

import { useId } from 'react';
import { useTranslations } from 'next-intl';

import { SelectField } from '@/modules/design-system';
import { SKILL_SCOPE_ORDER, isSkillLive, isSkillScopeValue } from '@/modules/teacher/lib/skill-scope';
import type { SkillScopeValue } from '@/modules/teacher/types/results-shell.types';

/**
 * teacher/15 — the student page's presentation of task 07's `skill-scope.ts`
 * (design S04 `:319–327`): ONE select, Reading live, the other three labelled
 * "— coming soon". The copy binds the existing keys across namespaces
 * (`Teacher.results.skills.<skill>` for the names, the drill-down's own
 * `soonSuffix`) — no second skill enum, no second label set. Selection is
 * narrowed by `isSkillScopeValue`, never cast.
 */
export function SkillSelect({
  skill,
  onValueChange,
}: {
  skill: SkillScopeValue;
  onValueChange: (skill: SkillScopeValue) => void;
}) {
  const tSkills = useTranslations('Teacher.results.skills');
  const t = useTranslations('Teacher.results.drillDown');
  const id = useId();

  return (
    <SelectField
      id={id}
      label={tSkills('listLabel')}
      placeholder={tSkills('listLabel')}
      options={SKILL_SCOPE_ORDER.map((value) => ({
        value,
        label: isSkillLive(value) ? tSkills(value) : `${tSkills(value)} ${t('soonSuffix')}`,
      }))}
      value={skill}
      onValueChange={(next) => {
        if (isSkillScopeValue(next)) onValueChange(next);
      }}
    />
  );
}
