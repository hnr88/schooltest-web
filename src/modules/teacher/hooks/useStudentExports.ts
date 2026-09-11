'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { showOpsToast } from '@/modules/ops/actions';
import { studentResultQueryOptions } from '@/modules/results';
import { writeClassSummaryWindow } from '@/modules/teacher/lib/print/class-summary-print';
import { buildStudentReportHtml } from '@/modules/teacher/lib/print/student-report-print';
import { saveTeacherExportFile } from '@/modules/teacher/lib/teacher-export-download';
import { carerReport } from '@/modules/teacher/lib/v2/carer-report';
import { studentDetail } from '@/modules/teacher/lib/v2/student-detail';
import { useTeacherDashboardQuery } from '@/modules/teacher/queries/use-teacher-dashboard.query';
import { useTeacherExportMutation } from '@/modules/teacher/queries/use-teacher-export.mutation';
import type { StudentReportLabels } from '@/modules/teacher/types/class-summary-print.types';
import type { StudentExportsApi } from '@/modules/teacher/types/students-table.types';
import type { StudentsTabRow } from '@/modules/teacher/types/v2-class-tabs.types';
import type { StudentDetailView } from '@/modules/teacher/types/v2-student-detail.types';

/**
 * The Students tab's two row exports, both real:
 * - PDF: the student's reading report printed from `GET /api/results/:id` (the
 *   results module's own query options) through `studentDetail()` and
 *   `carerReport()`, in a window opened inside the click so no pop-up blocker fires;
 * - LLM: the server's de-identified student Markdown
 *   (`GET /api/teacher/classes/:id/students/:sid/export`) through the teacher
 *   export mutation, saved under the server's filename.
 * Failures surface as toasts; nothing reports a success it did not have.
 */
export function useStudentExports(classDocumentId: string): StudentExportsApi {
  const queryClient = useQueryClient();
  const locale = useLocale();
  const t = useTranslations('TeacherPortal.students');
  const tVm = useTranslations('TeacherPortal.viewModel');
  const tKit = useTranslations('TeacherPortal.kit');
  const dashboard = useTeacherDashboardQuery();
  const llm = useTeacherExportMutation();
  const [pdfPendingId, setPdfPendingId] = useState<string | null>(null);
  const className =
    dashboard.data?.classes.find((entry) => entry.class_document_id === classDocumentId)?.name ?? '';

  const footer = (date: string, { count, since }: StudentDetailView['tiles']['sittings']) => {
    const time = since === null ? Number.NaN : Date.parse(since);
    if (count === 0 || Number.isNaN(time)) return t('print.footer', { name: className, date });
    const month = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(time);
    return t('print.footerSittings', { name: className, date, count, since: month });
  };

  const labelsFor = (name: string, date: string, detail: StudentDetailView): StudentReportLabels => ({
    title: t('print.title', { name }),
    assessment: t('print.assessment'),
    brand: t('print.brand'),
    overall: t('print.overall'),
    phase: t('print.phase'),
    growth: t('print.growth'),
    subskills: t('print.subskills'),
    subskill: t('print.subskill'),
    score: t('print.score'),
    band: t('print.band'),
    focus: t('print.focus'),
    strength: t('print.strength'),
    focusArea: t('print.focusArea'),
    vocabulary: t('print.vocabulary'),
    everyday: t('print.everyday'),
    academic: t('print.academic'),
    canDo: t('print.canDo'),
    next: t('print.next'),
    footer: footer(date, detail.tiles.sittings),
    noValue: tKit('noValue'),
    points: (value) => t('print.points', { value }),
    viewModel: (key) => tVm(key),
  });

  const printReport = async (row: StudentsTabRow, resultId: string, target: Window) => {
    const payload = await queryClient.fetchQuery(studentResultQueryOptions(resultId));
    if (payload.kind !== 'v2') {
      target.close();
      showOpsToast({ tone: 'warn', message: t('export.unavailable', { name: row.name }) });
      return;
    }
    const detail = studentDetail(payload.view);
    const carer = carerReport(payload.view, {
      document_id: row.studentDocumentId,
      name: row.name,
      initials: row.initials,
      eald_flag: row.ealdFlag,
    });
    const date = new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(new Date());
    const input = { name: row.name, className, date, lang: locale, detail, carer };
    writeClassSummaryWindow(target, buildStudentReportHtml(input, labelsFor(row.name, date, detail)));
    showOpsToast({ tone: 'ok', message: t('export.opened', { name: row.name }) });
  };

  const downloadPdf = (row: StudentsTabRow) => {
    const resultId = row.resultDocumentId;
    if (resultId === null) return;
    const target = window.open('', '_blank');
    if (target === null) {
      showOpsToast({ tone: 'error', message: t('export.popupBlocked') });
      return;
    }
    setPdfPendingId(row.studentDocumentId);
    printReport(row, resultId, target)
      .catch(() => {
        target.close();
        showOpsToast({ tone: 'error', message: t('export.failed', { name: row.name }) });
      })
      .finally(() => setPdfPendingId(null));
  };

  const downloadLlm = (row: StudentsTabRow) => {
    llm
      .mutateAsync({ kind: 'student', classDocumentId, studentDocumentId: row.studentDocumentId })
      .then((file) => {
        saveTeacherExportFile(file);
        showOpsToast({ tone: 'ok', message: t('export.saved') });
      })
      .catch(() => showOpsToast({ tone: 'error', message: t('export.llmFailed', { name: row.name }) }));
  };

  const pendingLlm = llm.isPending ? llm.variables : undefined;

  return {
    downloadPdf,
    downloadLlm,
    pdfPendingId,
    llmPendingId: pendingLlm?.kind === 'student' ? pendingLlm.studentDocumentId : null,
  };
}
