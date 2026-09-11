'use client';

import { ChevronLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { ComingSoonPanel } from '@/modules/teacher/components/ComingSoonPanel';
import { StudentSkillSelect } from '@/modules/teacher/components/StudentSkillSelect';
import { TeacherButton } from '@/modules/teacher/components/v2/TeacherButton';
import { DEFAULT_SKILL_SCOPE } from '@/modules/teacher/lib/skill-scope';
import type { StudentComingSoonProps } from '@/modules/teacher/types/student-drill-down.types';

// A skill the contract marks "soon" (`Teacher Portal v2.dc.html:488–513`): a 20/24 block
// with the skill select and "Back to Reading" across the top, then the ONE coming-soon
// body 14px under it, worded for this student.
function StudentComingSoon({ skill, onValueChange, firstName }: StudentComingSoonProps) {
  const tDrill = useTranslations('Teacher.results.drillDown');
  const tDetail = useTranslations('TeacherPortal.classDetail');
  const skillName = tDetail(`skills.${skill}`);

  return (
    <div data-slot="student-coming-soon" className="flex flex-col gap-[18px] px-6 py-5">
      <div className="flex flex-wrap items-center gap-2">
        <StudentSkillSelect skill={skill} onValueChange={onValueChange} />
        <TeacherButton
          tone="primary"
          size="md"
          data-slot="student-back-to-reading"
          onClick={() => onValueChange(DEFAULT_SKILL_SCOPE)}
          className="gap-1.5 px-3.5 text-[13px] font-semibold"
        >
          <ChevronLeft aria-hidden="true" className="size-[15px]" strokeWidth={2.2} />
          {tDrill('backToReading')}
        </TeacherButton>
      </div>
      <ComingSoonPanel
        title={tDetail('comingSoonTitle', { skill: skillName })}
        description={tDrill('comingSoonBody', { student: firstName, skill: skillName })}
        className="px-0 pt-3.5 pb-0"
      />
    </div>
  );
}

export { StudentComingSoon };
