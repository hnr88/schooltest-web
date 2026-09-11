'use client';

import { useTranslations } from 'next-intl';

import { ProgressClassChart } from '@/modules/teacher/components/ProgressClassChart';
import { PROGRESS_I18N_NAMESPACE } from '@/modules/teacher/constants/progress-tab.constants';
import { VIEW_MODEL_I18N_NAMESPACE } from '@/modules/teacher/constants/v2-i18n.constants';
import type { ProgressAcaraSectionProps } from '@/modules/teacher/types/progress-tab.types';

// "Class reading over time" (`Teacher Portal v2.dc.html:893–921`): title, the ACARA
// legend (Beginning first), the banded chart and the class-average sentence under it.
function ProgressAcaraSection({ chart, summary }: ProgressAcaraSectionProps) {
  const t = useTranslations(PROGRESS_I18N_NAMESPACE);
  const tVm = useTranslations(VIEW_MODEL_I18N_NAMESPACE);

  return (
    <div data-slot="progress-acara" className="min-w-[min(300px,100%)] flex-[2_1_420px]">
      <h3 id="progress-chart-heading" className="text-[15px] font-semibold text-navy-900">
        {t('chart.title')}
      </h3>
      <p className="mt-[3px] text-[12.5px] text-[#6B7280]">{t('chart.description')}</p>
      <ul aria-label={t('chart.legendLabel')} className="mt-3 flex flex-wrap items-center gap-4">
        {chart.legend.map((band) => (
          <li
            key={band.phase}
            className="inline-flex items-center gap-[7px] text-[12px] font-semibold text-[#4B5563]"
          >
            <span
              aria-hidden="true"
              className="size-3 rounded-[3px] border border-[rgba(14,35,80,0.08)]"
              style={{ backgroundColor: band.fill }}
            />
            {tVm(band.labelKey)}
          </li>
        ))}
      </ul>
      <div className="mt-3.5">
        <ProgressClassChart chart={chart} />
      </div>
      <p
        data-slot="progress-summary"
        className="mt-3.5 border-t border-[#ECEEF2] pt-3.5 text-[13px] font-medium text-[#4B5563]"
      >
        {t(summary.key, summary.values)}
      </p>
    </div>
  );
}

export { ProgressAcaraSection };
