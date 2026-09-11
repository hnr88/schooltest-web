import { useFormatter, useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { InitialsAvatar } from '@/modules/teacher/components/v2/InitialsAvatar';
import { TeacherButton } from '@/modules/teacher/components/v2/TeacherButton';
import { ToneChip } from '@/modules/teacher/components/v2/ToneChip';
import { EXPECTED_CHIP_TONE, RELEASE_CHIP_TONE } from '@/modules/teacher/constants/family-reports.constants';
import type { FamilyReportRowItemProps } from '@/modules/teacher/types/v2-family.types';

const ROW_BUTTON = 'h-[34px] rounded-[8px] px-[13px] text-[12.5px]';

function FamilyReportRowItem({ row, onPreview, onRelease, onRecall }: FamilyReportRowItemProps) {
  const t = useTranslations('TeacherPortal.familyReports');
  const tView = useTranslations('TeacherPortal.viewModel');
  const tKit = useTranslations('TeacherPortal.kit');
  const format = useFormatter();
  const at = row.releasedAt === null ? '' : format.dateTime(new Date(row.releasedAt), { dateStyle: 'medium' });
  const score =
    row.score !== null ? t('score', { score: row.score }) : row.resultDocumentId === null ? t('noResult') : tKit('noValue');
  const hasActions = row.actions.preview || row.actions.release || row.actions.recall;

  return (
    <div
      role="listitem"
      data-slot="family-report-row"
      data-student-id={row.studentDocumentId}
      data-result-id={row.resultDocumentId ?? undefined}
      data-status={row.status.kind}
      className="flex flex-wrap items-start gap-4 border-b border-[#EEF1F6] px-5 py-4 last:border-b-0"
    >
      <InitialsAvatar initials={row.initials} size="sm" tone="soft" className="text-[12px]" />
      <div className="min-w-[200px] flex-[2_1_240px]">
        <div className="flex flex-wrap items-center gap-[9px]">
          <span className="text-[14.5px] font-semibold text-navy-900">{row.name}</span>
          {row.expected === null ? null : (
            <ToneChip tone={EXPECTED_CHIP_TONE[row.expected.kind]} size="sm">
              {tView(row.expected.labelKey)}
            </ToneChip>
          )}
        </div>
        <p className="mt-1.5 max-w-[70ch] text-[12.5px] leading-[1.5] text-[#6B7280]">{tView(row.whyKey, { at })}</p>
      </div>
      <div
        data-slot="family-report-score"
        className={cn(
          'flex-[0_1_90px] text-[15px] font-semibold tabular-nums',
          row.score === null ? 'text-[#6B7280]' : 'text-navy-900',
        )}
      >
        {score}
      </div>
      <ToneChip tone={RELEASE_CHIP_TONE[row.status.kind]} size="sm" className="shrink-0 px-[11px] py-[5px]">
        {tView(row.status.labelKey)}
      </ToneChip>
      {hasActions ? (
        <div className="ml-auto flex gap-2">
          {row.actions.preview ? (
            <TeacherButton
              tone="outline"
              size="sm"
              className={cn(ROW_BUTTON, 'border-[#D8DFEA] font-medium hover:border-[#D8DFEA] hover:bg-[#F5F6F8]')}
              onClick={onPreview}
            >
              {t('actions.preview')}
            </TeacherButton>
          ) : null}
          {row.actions.release ? (
            <TeacherButton
              tone="outline"
              size="sm"
              className={cn(ROW_BUTTON, 'border-[#D8DFEA] font-semibold hover:border-[#D8DFEA] hover:bg-[#FAFBFC]')}
              onClick={onRelease}
            >
              {t('actions.release')}
            </TeacherButton>
          ) : null}
          {row.actions.recall ? (
            <TeacherButton
              tone="dangerOutline"
              size="sm"
              className={cn(ROW_BUTTON, 'font-semibold hover:bg-[#FAFBFC]')}
              onClick={onRecall}
            >
              {t('actions.recall')}
            </TeacherButton>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export { FamilyReportRowItem };
