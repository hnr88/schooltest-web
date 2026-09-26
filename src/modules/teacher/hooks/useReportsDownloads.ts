'use client';

import { useLocale, useTranslations } from 'next-intl';

import { showOpsToast } from '@/modules/ops/actions';
import type { RosterRow } from '@/modules/results';
import { useStudentExports } from '@/modules/teacher/hooks/useStudentExports';
import { useStudentReportLabels } from '@/modules/teacher/hooks/useStudentReportLabels';
import { writeClassSummaryWindow } from '@/modules/teacher/lib/print/class-summary-print';
import { buildStudentReportsHtml, scoredStudentInputs } from '@/modules/teacher/lib/print/student-report-print';
import { useTeacherDashboardQuery } from '@/modules/teacher/queries/use-teacher-dashboard.query';
import type { ReportsDownloadsApi } from '@/modules/teacher/types/v2-family.types';

export function useReportsDownloads(classDocumentId: string, rows: readonly RosterRow[]): ReportsDownloadsApi {
  const t = useTranslations('TeacherPortal.familyReports');
  const locale = useLocale();
  const dashboard = useTeacherDashboardQuery();
  const className =
    dashboard.data?.classes.find((entry) => entry.class_document_id === classDocumentId)?.name ?? '';
  const labelsFor = useStudentReportLabels(className);
  const studentExports = useStudentExports(classDocumentId);

  const downloadAll = () => {
    const target = window.open('', '_blank');
    if (target === null) {
      showOpsToast({ tone: 'error', message: t('download.popupBlocked') });
      return;
    }
    try {
      const date = new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(new Date());
      const pages = scoredStudentInputs(rows, { className, date, lang: locale }).map((input) => ({
        input,
        labels: labelsFor(input.name, date, input.detail),
      }));
      const doc = { title: t('download.studentsTitle', { name: className }), lang: locale };
      writeClassSummaryWindow(target, buildStudentReportsHtml(pages, doc));
      showOpsToast({ tone: 'ok', message: t('download.allOpened') });
    } catch {
      target.close();
      showOpsToast({ tone: 'error', message: t('download.allFailed') });
    }
  };

  return { downloadPdf: studentExports.downloadPdf, downloadAll, pdfPendingId: studentExports.pdfPendingId };
}
