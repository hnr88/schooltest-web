'use client';

import { useTranslations } from 'next-intl';

import { STUDENT_I18N_NAMESPACE } from '@/modules/teacher/constants/student-detail.constants';
import { useStudentText } from '@/modules/teacher/hooks/useStudentText';
import { overallDeltaText } from '@/modules/teacher/lib/student-detail-text';
import type { StudentOverallChipProps } from '@/modules/teacher/types/student-drill-down.types';

// The navy "Overall reading" chip (`Teacher Portal v2.dc.html:338–342`): the latest
// domain score and the server's own growth step in the colour of its direction.
function StudentOverallChip({ overall }: StudentOverallChipProps) {
  const t = useTranslations(STUDENT_I18N_NAMESPACE);
  const { text } = useStudentText();
  const delta = overallDeltaText(overall.growth);

  return (
    <div data-slot="student-overall" className="flex items-center gap-3 rounded-[11px] bg-navy-900 px-[18px] py-[11px]">
      <span className="max-w-[5.5rem] text-[11px] leading-[1.3] font-semibold tracking-[0.05em] text-[#AEBBD6] uppercase">
        {t('overallLabel')}
      </span>
      <span
        data-slot="student-overall-score"
        className="text-[30px] leading-none font-semibold tracking-[-0.02em] text-white tabular-nums"
      >
        {overall.score === null ? null : t('percent', { value: overall.score })}
      </span>
      {delta === null ? null : (
        <span
          data-slot="student-overall-delta"
          className="rounded-full bg-white px-[9px] py-[3px] text-[12.5px] font-semibold whitespace-nowrap tabular-nums"
          style={{ color: overall.growth.fg }}
        >
          {text(delta)}
        </span>
      )}
    </div>
  );
}

export { StudentOverallChip };
