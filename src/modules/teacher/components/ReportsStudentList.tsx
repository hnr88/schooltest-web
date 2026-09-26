'use client';

import { Download } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { InitialsAvatar } from '@/modules/teacher/components/v2/InitialsAvatar';
import { PhaseChip } from '@/modules/teacher/components/v2/PhaseChip';
import { TeacherButton } from '@/modules/teacher/components/v2/TeacherButton';
import { acaraPhaseKey } from '@/modules/teacher/lib/teacher-kit';
import type { ReportsStudentListProps } from '@/modules/teacher/types/v2-family.types';

function ReportsStudentList({ view, audience, downloads }: ReportsStudentListProps) {
  const t = useTranslations('TeacherPortal.familyReports');
  const tKit = useTranslations('TeacherPortal.kit');
  const enabled = audience === 'parents';

  return (
    <div
      data-slot="reports-students"
      className="overflow-hidden rounded-[16px] border border-[#E6EBF3] bg-white shadow-[0_1px_3px_rgba(14,35,80,0.05)]"
    >
      <div className="flex flex-wrap items-center gap-3 border-b border-[#E6EBF3] bg-[#F5F8FD] py-3.5 pr-4 pl-5">
        <div className="min-w-[180px] flex-1">
          <div className="text-[15px] font-semibold text-navy-900">{t('students.title')}</div>
          <div data-slot="reports-students-meta" className="mt-px text-[12px] text-[#6B7280]">
            {t('students.meta', { scored: view.scored, total: view.total, audience: t(`audiences.${audience}`) })}
          </div>
        </div>
        {enabled ? null : (
          <span data-slot="reports-students-soon" className="text-[12px] font-medium text-[#6B7280]">
            {t('comingSoon')}
          </span>
        )}
        <TeacherButton
          tone="outline"
          size="sm"
          data-slot="reports-download-all"
          disabled={!enabled || view.scored === 0}
          onClick={downloads.downloadAll}
          className="rounded-[9px] border-[#E1E9F7] text-[12.5px] font-semibold"
        >
          <Download size={14} aria-hidden="true" />
          {t('students.downloadAll')}
        </TeacherButton>
      </div>
      <ul role="list" aria-label={t('students.title')} className="flex flex-col p-2">
        {view.rows.map((row) => (
          <li
            key={row.studentDocumentId}
            data-slot="reports-student-row"
            data-student-id={row.studentDocumentId}
            data-has-result={row.hasResult}
            data-scored={row.isScored}
            className="flex items-center gap-3 rounded-[10px] px-3 py-[9px] hover:bg-[#F7F9FD]"
          >
            <InitialsAvatar initials={row.initials} size="xs" className="flex-none bg-[#DCE6F6] text-[10.5px] font-bold" />
            <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-navy-900" title={row.name}>
              {row.name}
            </span>
            <span data-slot="reports-phase" className="flex-none">
              {row.phase === null ? (
                <span className="inline-flex items-center rounded-full border border-[#ECEEF2] bg-[#F5F6F8] px-[9px] py-[3px] text-[11.5px] font-semibold text-[#6B7280]">
                  {tKit('noValue')}
                </span>
              ) : (
                <PhaseChip variant="pill" phase={acaraPhaseKey(row.phase.phase)} className="px-[9px] text-[11.5px]" />
              )}
            </span>
            <span className="flex flex-none justify-end sm:w-[120px]">
              {row.isScored ? (
                <TeacherButton
                  tone="outline"
                  size="xs"
                  data-slot="reports-student-pdf"
                  disabled={!enabled}
                  loading={downloads.pdfPendingId === row.studentDocumentId}
                  onClick={() => downloads.downloadPdf(row)}
                  aria-label={t('students.pdfFor', { name: row.name })}
                  className="rounded-[8px]"
                >
                  <Download size={14} aria-hidden="true" />
                  {t('students.pdf')}
                </TeacherButton>
              ) : (
                <span data-slot="reports-no-result" className="text-[12px] whitespace-nowrap text-[#6B7280]">
                  {t('students.noResultYet')}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export { ReportsStudentList };
