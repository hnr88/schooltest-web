'use client';

import { CircleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Textarea } from '@/components/ui/textarea';
import {
  Label,
  OpsDialog,
  OpsDialogCancel,
  OpsDialogClose,
  OpsDialogContent,
  OpsDialogCta,
  OpsDialogDescription,
  OpsDialogTitle,
} from '@/modules/design-system';
import { RECALL_REASON_MAX } from '@/modules/teacher/constants/family-reports.constants';
import type { RecallReportDialogProps } from '@/modules/teacher/types/v2-family.types';

const REASON_ID = 'family-report-recall-reason';

function RecallReportDialog({ actions, name }: RecallReportDialogProps) {
  const t = useTranslations('TeacherPortal.familyReports');
  const describedBy = actions.error === null ? `${REASON_ID}-hint` : `${REASON_ID}-hint ${REASON_ID}-error`;

  return (
    <OpsDialog open onOpenChange={(open) => (open ? undefined : actions.close())} disablePointerDismissal>
      <OpsDialogContent role="alertdialog" data-slot="recall-report-dialog" className="sm:max-w-[440px]">
        <div className="p-7">
          <div
            aria-hidden="true"
            className="mb-4 grid size-11 place-items-center rounded-[14px] bg-[#FEE4E2] text-[#B42318]"
          >
            <CircleAlert className="size-5" />
          </div>
          <OpsDialogTitle className="text-[19px] leading-tight">{t('recall.title', { name })}</OpsDialogTitle>
          <OpsDialogDescription className="mt-2.5 text-sm leading-relaxed text-[#64748B]">
            {t('recall.body')}
          </OpsDialogDescription>
          <div className="mt-[18px] flex flex-col">
            <Label htmlFor={REASON_ID} className="mb-[7px] text-[12.5px] font-semibold text-navy-900">
              {t('recall.reasonLabel')}
            </Label>
            <Textarea
              id={REASON_ID}
              value={actions.reason}
              maxLength={RECALL_REASON_MAX}
              disabled={actions.pending}
              aria-invalid={actions.error !== null}
              aria-describedby={describedBy}
              className="min-h-[88px] rounded-[8px] border-[#ECEEF2] px-3.5 py-3 text-[13.5px] text-navy-900"
              onChange={(event) => actions.setReason(event.target.value)}
            />
            <p id={`${REASON_ID}-hint`} className="mt-1.5 text-[12px] text-[#6B7280]">
              {t('recall.reasonHint')}
            </p>
          </div>
          {actions.error === null ? null : (
            <p
              id={`${REASON_ID}-error`}
              role="alert"
              className="mt-3 flex items-center gap-2 text-[12.5px] font-semibold text-[#B42318]"
            >
              <CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
              {actions.error}
            </p>
          )}
          <div className="mt-6 flex items-center justify-end gap-2.5">
            <OpsDialogClose render={<OpsDialogCancel disabled={actions.pending} />}>{t('cancel')}</OpsDialogClose>
            <OpsDialogCta
              type="button"
              loading={actions.pending}
              className="bg-[#B42318] hover:bg-[#91201A]"
              onClick={actions.run}
            >
              {t('recall.cta')}
            </OpsDialogCta>
          </div>
        </div>
      </OpsDialogContent>
    </OpsDialog>
  );
}

export { RecallReportDialog };
