'use client';

import { useTranslations } from 'next-intl';

import { SectionCard } from '@/modules/teacher/components/v2/SectionCard';
import type { CohortGlanceCardProps } from '@/modules/teacher/types/class-analytics.types';

// Teaching insights · Cohort at a glance (`:801–820`): the ACARA phase spread of the
// students with a phase (the server's phase; score cuts only where it sent none), the
// ±5 growth counts over the server deltas, and the two vocabulary strand means.
function CohortGlanceCard({ cohort }: CohortGlanceCardProps) {
  const t = useTranslations('TeacherPortal.insights');
  const tv = useTranslations('TeacherPortal.viewModel');
  const noValue = useTranslations('TeacherPortal.kit')('noValue');
  const percent = (value: number | null) => (value === null ? noValue : t('percent', { value }));
  const { growth, vocab } = cohort;

  return (
    <SectionCard data-insights-section="cohort" title={t('cohort.title')}>
      <div data-slot="insights-cohort" data-phased={cohort.phased} className="-mt-0.5">
        <div className="text-[12px] font-semibold tracking-[0.05em] text-[#6B7280] uppercase">
          {t('cohort.phaseSpread')}
        </div>
        <ul className="mt-[11px] flex flex-col gap-[9px]">
          {cohort.phases.map((bar) => (
            <li
              key={bar.phase}
              data-slot="insights-phase-bar"
              data-phase={bar.phase}
              data-count={bar.count}
              className="flex items-center gap-2.5"
            >
              <span className="w-[104px] flex-none text-[12.5px] text-[#4B5563]">{tv(bar.labelKey)}</span>
              <div aria-hidden="true" className="h-[9px] flex-1 overflow-hidden rounded-full bg-[#F0F2F5]">
                <div className="h-full rounded-full" style={{ width: `${bar.width}%`, background: bar.fg }} />
              </div>
              <span className="w-5 flex-none text-right text-[12.5px] font-semibold text-navy-900 tabular-nums">
                {bar.count}
              </span>
            </li>
          ))}
        </ul>
        <dl className="mt-[18px] flex flex-col gap-2 border-t border-[#ECEEF2] pt-4 text-[13px] text-[#4B5563]">
          <div className="flex items-center gap-2">
            <dt className="w-[74px] flex-none text-[11px] font-semibold tracking-[0.04em] text-[#6B7280] uppercase">
              {t('cohort.growth')}
            </dt>
            <dd data-slot="insights-growth" data-paired={growth.paired}>
              {growth.paired === 0
                ? noValue
                : t('cohort.growthText', { improved: growth.improved, held: growth.held, slipped: growth.slipped })}
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="w-[74px] flex-none text-[11px] font-semibold tracking-[0.04em] text-[#6B7280] uppercase">
              {t('cohort.vocab')}
            </dt>
            <dd data-slot="insights-vocab">{t('cohort.vocabText', { a2: percent(vocab.a2), b1: percent(vocab.b1) })}</dd>
          </div>
        </dl>
      </div>
    </SectionCard>
  );
}

export { CohortGlanceCard };
