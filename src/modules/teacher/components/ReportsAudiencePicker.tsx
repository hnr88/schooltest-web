'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { REPORT_AUDIENCES } from '@/modules/teacher/constants/family-reports.constants';
import { KIT_FOCUS_RING } from '@/modules/teacher/constants/teacher-kit-controls.constants';
import type { ReportsAudiencePickerProps } from '@/modules/teacher/types/v2-family.types';

function ReportsAudiencePicker({ value, titleId, onChange }: ReportsAudiencePickerProps) {
  const t = useTranslations('TeacherPortal.familyReports');

  return (
    <div className="flex flex-col gap-4 rounded-[16px] border border-[#E1E9F7] bg-gradient-to-br from-[#EEF3FC] to-[#F7F9FD] px-6 py-[22px]">
      <div>
        <h2 id={titleId} className="text-[22px] font-semibold tracking-[-0.02em] text-navy-900">
          {t('title')}
        </h2>
        <p className="mt-1.5 text-[13.5px] text-[#4B5563]">{t('audiencePrompt')}</p>
      </div>
      <div
        role="group"
        aria-label={t('audiencePrompt')}
        data-slot="reports-audiences"
        className="flex flex-wrap gap-1 self-start rounded-[12px] border border-[#E1E9F7] bg-white p-1"
      >
        {REPORT_AUDIENCES.map((audience) => {
          const active = audience === value;
          return (
            <button
              key={audience}
              type="button"
              aria-pressed={active}
              data-audience={audience}
              onClick={() => onChange(audience)}
              className={cn(
                'h-9 rounded-[9px] px-[15px] text-[13px] font-semibold whitespace-nowrap transition-colors motion-reduce:transition-none',
                KIT_FOCUS_RING,
                active ? 'bg-navy-900 text-white' : 'bg-transparent text-[#4B5563] hover:bg-[#F5F6F8]',
              )}
            >
              {t(`audiences.${audience}`)}
            </button>
          );
        })}
      </div>
      <p data-slot="reports-note" className="text-[12.5px] text-[#4B5563]">
        {t(`notes.${value}`)}
      </p>
    </div>
  );
}

export { ReportsAudiencePicker };
