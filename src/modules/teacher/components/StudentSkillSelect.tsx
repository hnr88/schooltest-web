'use client';

import { useTranslations } from 'next-intl';

import { PillSelect } from '@/modules/teacher/components/v2/PillSelect';
import { STUDENT_I18N_NAMESPACE } from '@/modules/teacher/constants/student-detail.constants';
import { SKILL_SCOPE_ORDER, isSkillLive, isSkillScopeValue } from '@/modules/teacher/lib/skill-scope';
import type { StudentSkillSelectProps } from '@/modules/teacher/types/student-drill-down.types';

// The student skill select (`Teacher Portal v2.dc.html:325–330`): Reading, then the
// three skills the contract marks "soon", from the ONE list the class skill tabs use.
function StudentSkillSelect({ skill, onValueChange }: StudentSkillSelectProps) {
  const t = useTranslations(STUDENT_I18N_NAMESPACE);
  const tSkills = useTranslations('TeacherPortal.classDetail.skills');

  return (
    <PillSelect
      size="md"
      data-slot="student-skill-select"
      label={t('skillLabel')}
      value={skill}
      options={SKILL_SCOPE_ORDER.map((value) => ({
        value,
        label: isSkillLive(value) ? tSkills(value) : t('skillSoon', { skill: tSkills(value) }),
      }))}
      onValueChange={(next) => {
        if (isSkillScopeValue(next)) onValueChange(next);
      }}
    />
  );
}

export { StudentSkillSelect };
