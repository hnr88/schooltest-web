'use client';

import { useTranslations } from 'next-intl';

import { PROGRESS_I18N_NAMESPACE } from '@/modules/teacher/constants/progress-tab.constants';
import type { ProgressClassAnalysisProps } from '@/modules/teacher/types/progress-tab.types';

/**
 * §3e "Class analysis" — the honest COMING-SOON state (§0.1): the deterministic
 * reliable-mover count line (the same tally as the dot map's summary) may show,
 * but the interpretive prose is a muted placeholder, never generated text, and
 * the card is not hidden. No Copy button until a real generated source exists.
 */
function ProgressClassAnalysis({ counts }: ProgressClassAnalysisProps) {
  const t = useTranslations(PROGRESS_I18N_NAMESPACE);
  const total = counts.up + counts.held + counts.down;

  return (
    <section
      data-slot="progress-analysis"
      aria-labelledby="progress-analysis-heading"
      className="flex flex-col gap-3 rounded-[11px] border border-[#E4EBF6] border-l-[3px] border-l-[#1A3B8B] bg-white px-[22px] py-5"
    >
      <h3 id="progress-analysis-heading" className="text-[15px] font-semibold text-navy-900">
        {t('analysis.title')}
      </h3>
      {total > 0 ? (
        <p data-slot="progress-analysis-counts" className="text-[13.5px] text-[#374151]">
          {t('dotMap.classSummary', {
            up: counts.up,
            total,
            held: counts.held,
            down: counts.down,
          })}
        </p>
      ) : null}
      <p data-slot="progress-analysis-coming-soon" className="text-[13px] text-[#6B7280]">
        {t('analysis.comingSoon')}
      </p>
    </section>
  );
}

export { ProgressClassAnalysis };
