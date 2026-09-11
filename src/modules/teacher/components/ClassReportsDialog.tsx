'use client';

import { useTranslations } from 'next-intl';

import { OpsDialog, OpsDialogContent, OpsDialogDescription, OpsDialogTitle } from '@/modules/design-system';
import { ReportsFormatField, ReportsKindField } from '@/modules/teacher/components/ReportsFields';
import { TeacherButton } from '@/modules/teacher/components/v2/TeacherButton';
import {
  REPORTS_CANCEL_CLASS,
  REPORTS_CTA_CLASS,
  REPORTS_PANEL_CLASS,
} from '@/modules/teacher/constants/class-reports.constants';
import { useClassReports } from '@/modules/teacher/hooks/useClassReports';
import { useClassOverlaysStore } from '@/modules/teacher/stores/use-class-overlays-store';
import type { ClassReportsDialogProps } from '@/modules/teacher/types/class-reports.types';

// "Reports and data" (design S30, `Teacher Portal v2.dc.html:1626–1705`), mounted
// once by the class detail and opened by its header button through the overlays
// store. The CTA counts the students with a real scored result; with none, the
// design's blocked note shows and the CTA is disabled. The design's hidden parts
// ("Who to include", toggles) and its simulated "Recent exports" list are not built.
function ClassReportsDialog({ classCard, rows }: ClassReportsDialogProps) {
  const t = useTranslations('TeacherPortal.reports');
  const isOpen = useClassOverlaysStore((state) => state.reportsOpen);
  const close = useClassOverlaysStore((state) => state.close);
  const reports = useClassReports(classCard, rows);
  const blocked = reports.scored === 0;
  const cta = blocked
    ? t('pickStudents')
    : t(reports.format === 'print' ? 'openPrint' : 'generate', { count: reports.scored });

  return (
    <OpsDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <OpsDialogContent
        data-surface="class-reports-modal"
        data-kind={reports.kind}
        data-format={reports.format}
        className={REPORTS_PANEL_CLASS}
      >
        <OpsDialogTitle className="text-[21px] font-semibold text-navy-900">{t('title')}</OpsDialogTitle>
        <OpsDialogDescription className="mt-[7px] text-[13.5px] leading-[1.6] text-[#6B7280]">
          {t('sub')}
        </OpsDialogDescription>
        {blocked ? (
          <p
            data-slot="reports-blocked"
            className="mt-[18px] rounded-[10px] border border-[#F2DFB6] bg-[#FDF3E0] px-4 py-3.5 text-[13px] leading-[1.55] text-[#8A5A00]"
          >
            {t('blocked', { name: classCard.name })}
          </p>
        ) : null}
        <ReportsKindField value={reports.kind} forClass={classCard.name} onChange={reports.pickKind} />
        <ReportsFormatField formats={reports.formats} value={reports.format} onChange={reports.pickFormat} />
        <div className="mt-[26px] flex flex-wrap items-center gap-2.5">
          <TeacherButton
            tone="primary"
            size="2xl"
            data-slot="reports-generate"
            className={REPORTS_CTA_CLASS}
            disabled={blocked}
            loading={reports.isPending}
            onClick={reports.generate}
          >
            {cta}
          </TeacherButton>
          <TeacherButton
            tone="outline"
            size="2xl"
            data-slot="reports-cancel"
            className={REPORTS_CANCEL_CLASS}
            onClick={close}
          >
            {t('cancel')}
          </TeacherButton>
        </div>
      </OpsDialogContent>
    </OpsDialog>
  );
}

export { ClassReportsDialog };
