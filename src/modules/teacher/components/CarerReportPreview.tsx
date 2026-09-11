'use client';

import { useFormatter, useTranslations } from 'next-intl';

import {
  OpsDialog,
  OpsDialogClose,
  OpsDialogContent,
  OpsDialogDescription,
  OpsDialogTitle,
} from '@/modules/design-system';
import { InitialsAvatar } from '@/modules/teacher/components/v2/InitialsAvatar';
import { TeacherButton } from '@/modules/teacher/components/v2/TeacherButton';
import { ToneChip } from '@/modules/teacher/components/v2/ToneChip';
import { EXPECTED_CHIP_TONE, RELEASE_CHIP_TONE } from '@/modules/teacher/constants/family-reports.constants';
import { studentResultsHref } from '@/modules/teacher/lib/results-shell';
import type { CarerLine, CarerReportPreviewProps } from '@/modules/teacher/types/v2-family.types';

const FOOTER_BUTTON = 'h-11 rounded-[8px] px-5 text-[13.5px]';

function CarerLines({ title, lines }: { title: string; lines: readonly CarerLine[] }) {
  const tView = useTranslations('TeacherPortal.viewModel');
  if (lines.length === 0) return null;
  return (
    <section>
      <h3 className="text-[11.5px] font-semibold tracking-[0.06em] text-[#6B7280] uppercase">{title}</h3>
      <ul className="mt-2.5 flex flex-col gap-2">
        {lines.map((line) => (
          <li
            key={line.attribute}
            className="rounded-[9px] border border-[#ECEEF2] bg-[#FAFBFC] px-3.5 py-3 text-[13.5px] leading-[1.5] text-[#3D4A5C]"
          >
            {tView(line.key)}
          </li>
        ))}
      </ul>
    </section>
  );
}

function CarerReportPreview({ report, classDocumentId, className, onClose, onRelease, onRecall }: CarerReportPreviewProps) {
  const t = useTranslations('TeacherPortal.familyReports');
  const tView = useTranslations('TeacherPortal.viewModel');
  const tKit = useTranslations('TeacherPortal.kit');
  const format = useFormatter();
  const date =
    report.satAt === null
      ? null
      : format.dateTime(new Date(report.satAt), { day: 'numeric', month: 'long', timeZone: 'UTC' });

  return (
    <OpsDialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      <OpsDialogContent
        data-slot="carer-report-preview"
        data-result-id={report.resultDocumentId}
        className="rounded-[11px] sm:max-w-[560px]"
      >
        <div className="flex items-start gap-3.5 border-b border-[#ECEEF2] px-[30px] pt-[26px] pb-5">
          <InitialsAvatar initials={report.initials} size="lg" tone="soft" />
          <div className="min-w-0 flex-1">
            <p className="text-[11.5px] font-semibold tracking-[0.07em] text-[#6B7280] uppercase">{t('preview.eyebrow')}</p>
            <OpsDialogTitle className="mt-[7px] text-[20px] font-semibold tracking-[-0.01em] text-navy-900">
              {report.name}
            </OpsDialogTitle>
            <p className="mt-1 text-[12.5px] text-[#6B7280]">
              {date === null ? className : t('preview.meta', { className, date })}
            </p>
          </div>
          <ToneChip tone={RELEASE_CHIP_TONE[report.status.kind]} size="sm" className="shrink-0 px-[11px] py-[5px]">
            {tView(report.status.labelKey)}
          </ToneChip>
        </div>
        <div className="flex flex-col gap-5 px-[30px] pt-[22px] pb-[26px]">
          <div className="flex flex-wrap items-center gap-3">
            <span
              data-slot="carer-report-score"
              className="text-[34px] leading-none font-normal tracking-[-0.03em] text-navy-900 tabular-nums"
            >
              {report.score === null ? tKit('noValue') : t('preview.score', { score: report.score })}
            </span>
            {report.expected === null ? null : (
              <ToneChip tone={EXPECTED_CHIP_TONE[report.expected.kind]} size="lg" className="px-[11px]">
                {tView(report.expected.labelKey)}
              </ToneChip>
            )}
            {report.phase === null ? null : (
              <span className="text-[12.5px] text-[#6B7280]">{tView(report.phase.subLabelKey)}</span>
            )}
          </div>
          <OpsDialogDescription className="max-w-[64ch] text-[13px] leading-[1.6] text-[#6B7280]">
            {tView(report.summaryKey, { first: report.firstName })}
          </OpsDialogDescription>
          <CarerLines title={t('preview.canDo')} lines={report.canDo} />
          <CarerLines title={t('preview.next')} lines={report.next} />
          {report.ealdNoteKey === null ? null : (
            <p className="max-w-[70ch] rounded-[9px] border border-[#EBD9AE] bg-[#FDF9EF] px-4 py-3.5 text-[12.5px] leading-[1.6] text-[#6B5A38]">
              {tView(report.ealdNoteKey)}
            </p>
          )}
          <div className="flex flex-wrap gap-2.5 border-t border-[#ECEEF2] pt-5">
            {report.actions.release ? (
              <TeacherButton tone="primary" className={`${FOOTER_BUTTON} font-bold`} onClick={onRelease}>
                {t('preview.release')}
              </TeacherButton>
            ) : null}
            {report.actions.recall ? (
              <TeacherButton
                tone="primary"
                className={`${FOOTER_BUTTON} bg-[#B42318] font-bold hover:bg-[#91201A]`}
                onClick={onRecall}
              >
                {t('preview.recall')}
              </TeacherButton>
            ) : null}
            <TeacherButton
              tone="outline"
              href={studentResultsHref(classDocumentId, report.studentDocumentId)}
              className={`${FOOTER_BUTTON} border-[#D8DFEA] font-semibold hover:border-[#D8DFEA] hover:bg-[#F5F6F8]`}
            >
              {t('preview.viewAnalysis')}
            </TeacherButton>
            <OpsDialogClose
              render={
                <TeacherButton
                  tone="outline"
                  className={`${FOOTER_BUTTON} border-[#E5E7EB] font-semibold hover:border-[#E5E7EB] hover:bg-[#F5F6F8]`}
                />
              }
            >
              {t('preview.close')}
            </OpsDialogClose>
          </div>
        </div>
      </OpsDialogContent>
    </OpsDialog>
  );
}

export { CarerReportPreview };
