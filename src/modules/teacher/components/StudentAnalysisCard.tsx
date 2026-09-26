'use client';

import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { cn } from '@/lib/utils';
import { STUDENT_I18N_NAMESPACE } from '@/modules/teacher/constants/student-detail.constants';
import type { StudentAnalysisCardProps } from '@/modules/teacher/types/student-drill-down.types';

// "Student analysis" in its LOCKED coming-soon state (Spec 02 §0.1/§3d): the
// card stays visible beside the breakdown table, but until a real generated-
// analysis source exists it shows only a muted placeholder — no generated-summary
// badge, no Copy button and no sample paragraphs (the mock's commentary is
// explicitly illustrative). The shell matches the breakdown card beside it (mock `.card`).
function StudentAnalysisCard({ className }: StudentAnalysisCardProps) {
  const t = useTranslations(STUDENT_I18N_NAMESPACE);
  const headingId = useId();

  return (
    <section
      data-slot="student-analysis"
      aria-labelledby={headingId}
      className={cn(
        'flex flex-col overflow-hidden rounded-[16px] border border-[#E6EBF3] bg-white shadow-[0_1px_3px_rgba(14,35,80,0.05)]',
        className,
      )}
    >
      <h2 id={headingId} className="border-b border-[#E6EBF3] bg-[#F5F8FD] px-5 py-4 text-[16px] font-semibold text-navy-900">
        {t('analysisTitle')}
      </h2>
      <p data-slot="student-analysis-placeholder" className="px-[22px] pt-[18px] pb-[22px] text-[13.5px] leading-[1.65] text-[#6B7280]">
        {t('analysisComingSoon')}
      </p>
    </section>
  );
}

export { StudentAnalysisCard };
