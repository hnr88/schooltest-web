'use client';

import { Download, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { TeacherButton } from '@/modules/teacher/components/v2/TeacherButton';
import type { ReportsClassCardProps } from '@/modules/teacher/types/v2-family.types';

function ReportsClassCard({ className, audience, scored, total }: ReportsClassCardProps) {
  const t = useTranslations('TeacherPortal.familyReports');

  return (
    <div
      data-slot="reports-class-card"
      className="flex flex-wrap items-center gap-3.5 rounded-[16px] border border-[#E6EBF3] bg-white px-5 py-[18px] shadow-[0_1px_3px_rgba(14,35,80,0.05)]"
    >
      <span className="grid size-[42px] flex-none place-items-center rounded-[12px] bg-[#EAF0FB] text-[#1A3B8B]">
        <Users size={19} aria-hidden="true" />
      </span>
      <div className="min-w-[180px] flex-1">
        <div className="text-[15px] font-semibold text-navy-900">{t('classCard.title')}</div>
        <div data-slot="reports-class-meta" className="mt-0.5 text-[12.5px] text-[#6B7280]">
          {t('classCard.meta', { className, scored, total, audience: t(`audiences.${audience}`) })}
        </div>
      </div>
      <div className="flex flex-none items-center gap-2.5">
        <TeacherButton tone="primary" data-slot="reports-class-download" disabled className="rounded-[10px]">
          <Download size={14} aria-hidden="true" />
          {t('classCard.download')}
        </TeacherButton>
        <span className="text-[12px] font-medium text-[#6B7280]">{t('comingSoon')}</span>
      </div>
    </div>
  );
}

export { ReportsClassCard };
