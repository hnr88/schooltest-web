'use client';

import { Copy, Sparkle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { TeacherButton } from '@/modules/teacher/components/v2/TeacherButton';
import { ToneChip } from '@/modules/teacher/components/v2/ToneChip';
import { STUDENT_I18N_NAMESPACE } from '@/modules/teacher/constants/student-detail.constants';
import type { StudentAnalysisCardProps } from '@/modules/teacher/types/student-drill-down.types';

// "Student analysis" (`Teacher Portal v2.dc.html:466–485`): the generated summary, each
// sentence built from this student's own result. Copy hands the page the plain text.
function StudentAnalysisCard({ paragraphs, onCopy }: StudentAnalysisCardProps) {
  const t = useTranslations(STUDENT_I18N_NAMESPACE);
  const headingId = useId();

  return (
    <section
      data-slot="student-analysis"
      aria-labelledby={headingId}
      className="flex flex-col gap-[13px] rounded-[11px] border border-l-[3px] border-[#E4EBF6] border-l-[#1A3B8B] bg-white px-[22px] py-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-[9px]">
          <h2 id={headingId} className="text-[15px] font-semibold text-navy-900">
            {t('analysisTitle')}
          </h2>
          <ToneChip tone="info" size="xs" className="gap-[5px] px-[9px] py-[3px] font-semibold tracking-[0.03em]">
            <Sparkle aria-hidden="true" className="size-[11px]" fill="currentColor" strokeWidth={0} />
            {t('analysisBadge')}
          </ToneChip>
        </div>
        <TeacherButton tone="outline" size="xs" data-slot="student-analysis-copy" onClick={onCopy} className="flex-none">
          <Copy aria-hidden="true" className="size-[13px]" strokeWidth={2} />
          {t('copy')}
        </TeacherButton>
      </div>
      {paragraphs.map((paragraph) => (
        <p key={paragraph} className="text-[13.5px] leading-[1.65] text-[#374151]">
          {paragraph}
        </p>
      ))}
    </section>
  );
}

export { StudentAnalysisCard };
