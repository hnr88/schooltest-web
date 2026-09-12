'use client';

import { Download, Sparkle } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { StudentOverallChip } from '@/modules/teacher/components/StudentOverallChip';
import { StudentSkillSelect } from '@/modules/teacher/components/StudentSkillSelect';
import { InitialsAvatar } from '@/modules/teacher/components/v2/InitialsAvatar';
import { TeacherButton } from '@/modules/teacher/components/v2/TeacherButton';
import {
  STUDENT_HEADER_BUTTON_CLASS,
  STUDENT_I18N_NAMESPACE,
} from '@/modules/teacher/constants/student-detail.constants';
import type { StudentDrillDownHeaderProps } from '@/modules/teacher/types/student-drill-down.types';

// The student header (`Teacher Portal v2.dc.html:315–344`): initials, name and class,
// the skill select, the server's de-identified Markdown export (C-TR-7), Ask AI and the
// navy overall chip. A refused export is said in text under the actions, never swallowed.
function StudentDrillDownHeader({
  studentName,
  className,
  overall,
  actions,
  skill,
  onValueChange,
}: StudentDrillDownHeaderProps) {
  const t = useTranslations(STUDENT_I18N_NAMESPACE);
  const tExport = useTranslations('Teacher.results.export');

  return (
    <div data-slot="student-drill-down-header" className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div className="flex min-w-0 items-center gap-4">
          <InitialsAvatar name={studentName} size="xl" tone="blue" className="flex-none" />
          <div className="min-w-0">
            <h1 className="text-[25px] font-semibold tracking-[-0.02em] break-words text-navy-900">
              {studentName}
            </h1>
            <p data-slot="student-meta" className="mt-[3px] text-[13.5px] text-[#6B7280]">
              {t('subtitle', { class: className })}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <StudentSkillSelect skill={skill} onValueChange={onValueChange} />
            {actions === null ? null : (
              <>
                <TeacherButton
                  tone="outline"
                  size="md"
                  data-slot="student-export-button"
                  title={t('exportTitle')}
                  loading={actions.exportPending}
                  onClick={actions.exportMarkdown}
                  className={STUDENT_HEADER_BUTTON_CLASS}
                >
                  <Download aria-hidden="true" className="size-[15px]" strokeWidth={2} />
                  {t('export')}
                </TeacherButton>
                <TeacherButton
                  tone="primary"
                  size="md"
                  data-slot="student-ask-ai-button"
                  title={t('askAiTitle')}
                  aria-expanded={actions.askAiOpen}
                  onClick={actions.askAi}
                  // P1 round 2 row N9: the design draws THIS navy button with a
                  // 1px same-colour border (`:334`) — 94px on "Ask AI" and 99px
                  // on "Hide AI", not 92 and 97. The kit's `primary` tone keeps
                  // `border-0` (round 1 row 19).
                  className={`${STUDENT_HEADER_BUTTON_CLASS} border border-navy-900`}
                >
                  <Sparkle aria-hidden="true" className="size-[15px]" strokeWidth={2} />
                  {actions.askAiOpen ? t('hideAi') : t('askAi')}
                </TeacherButton>
              </>
            )}
          </div>
          {overall === null ? null : <StudentOverallChip overall={overall} />}
        </div>
      </div>
      {actions?.exportFailed ? (
        <p role="alert" data-slot="teacher-export-error" className="self-end text-[12.5px] text-[#B42318]">
          {tExport('failed')}
        </p>
      ) : null}
    </div>
  );
}

export { StudentDrillDownHeader };
