'use client';

import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { StudentAnalysisCard } from '@/modules/teacher/components/StudentAnalysisCard';
import { StudentProgressPanel } from '@/modules/teacher/components/StudentProgressPanel';
import { StudentSubskillCard } from '@/modules/teacher/components/StudentSubskillCard';
import { STUDENT_I18N_NAMESPACE } from '@/modules/teacher/constants/student-detail.constants';
import { useStudentText } from '@/modules/teacher/hooks/useStudentText';
import type { StudentDrillDownBodyProps } from '@/modules/teacher/types/student-drill-down.types';

// The Reading body (`Teacher Portal v2.dc.html:394–485`), built only from the
// `studentDetail()` view: progress over time, the seven subskill cards and the
// generated analysis (dropped whole when no sentence has a value behind it).
function StudentDrillDownBody({ view, firstName, onCopy }: StudentDrillDownBodyProps) {
  const t = useTranslations(STUDENT_I18N_NAMESPACE);
  const { analysis } = useStudentText();
  const headingId = useId();
  const paragraphs = analysis(view, firstName);

  return (
    <>
      <StudentProgressPanel view={view} />
      <section data-slot="student-subskills" aria-labelledby={headingId}>
        <h2 id={headingId} className="text-[15px] font-semibold text-navy-900">
          {t('subskillsTitle')}
        </h2>
        <p className="mt-[3px] text-[12.5px] text-[#6B7280]">{t('subskillsDescription', { first: firstName })}</p>
        <ul className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(min(280px,100%),1fr))] gap-3.5">
          {view.subskills.map((card) => (
            <li key={card.skill} className="flex">
              <StudentSubskillCard card={card} />
            </li>
          ))}
        </ul>
      </section>
      {paragraphs.length === 0 ? null : (
        <StudentAnalysisCard paragraphs={paragraphs} onCopy={() => onCopy(paragraphs.join('\n\n'))} />
      )}
    </>
  );
}

export { StudentDrillDownBody };
