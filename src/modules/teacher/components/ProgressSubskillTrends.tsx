'use client';

import { useTranslations } from 'next-intl';

import { DeltaText } from '@/modules/teacher/components/v2/DeltaText';
import { SectionCard } from '@/modules/teacher/components/v2/SectionCard';
import { PROGRESS_I18N_NAMESPACE } from '@/modules/teacher/constants/progress-tab.constants';
import { VIEW_MODEL_I18N_NAMESPACE } from '@/modules/teacher/constants/v2-i18n.constants';
import type { ProgressSubskillTrendsProps } from '@/modules/teacher/types/progress-tab.types';

// "Subskill movement over time" (`Teacher Portal v2.dc.html:956–974`): for each subskill
// with a class mean on record, its latest mean, the class mean by sitting as a sparkline
// (`sparkline()`, 132×40 drawn at 92×30) and the first → latest difference, weakest first.
function ProgressSubskillTrends({ trends }: ProgressSubskillTrendsProps) {
  const t = useTranslations(PROGRESS_I18N_NAMESPACE);
  const tVm = useTranslations(VIEW_MODEL_I18N_NAMESPACE);

  return (
    <SectionCard
      data-slot="progress-subskill-trends"
      aria-labelledby="progress-trends-heading"
      padding="none"
      className="gap-0 rounded-[12px] px-6 py-[22px]"
    >
      <h3 id="progress-trends-heading" className="text-[15px] font-semibold text-navy-900">
        {t('subskills.title')}
      </h3>
      <p className="mt-[3px] text-[12.5px] text-[#6B7280]">{t('subskills.description')}</p>
      <ul className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(min(280px,100%),1fr))] gap-3">
        {trends.map((trend) => (
          <li
            key={trend.skill}
            data-slot="progress-subskill-trend"
            data-skill={trend.skill}
            data-now={trend.now ?? undefined}
            className="flex items-center gap-3.5 rounded-[11px] border border-[#ECEEF2] bg-white px-4 py-[13px]"
          >
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-semibold text-navy-900">{tVm(trend.labelKey)}</div>
              <div className="mt-px text-[12px] text-[#6B7280]">{t('subskills.now', { value: trend.now ?? '' })}</div>
            </div>
            <svg
              viewBox={`0 0 ${trend.spark.w} ${trend.spark.h}`}
              preserveAspectRatio="none"
              aria-hidden="true"
              className="h-[30px] w-[92px] flex-none"
            >
              <polyline points={trend.spark.polyline} fill="none" stroke={trend.stroke} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
              {trend.spark.last === null ? null : (
                <circle cx={trend.spark.last.cx} cy={trend.spark.last.cy} r={3.5} fill={trend.stroke} />
              )}
            </svg>
            <span className="min-w-10 text-right">
              <DeltaText
                value={trend.difference}
                format={trend.difference === 0 ? 'signed' : 'arrowSigned'}
                className="text-[13px]"
              />
            </span>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

export { ProgressSubskillTrends };
