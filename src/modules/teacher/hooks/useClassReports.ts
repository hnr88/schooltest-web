'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { showOpsToast } from '@/modules/ops/actions';
import { scoredCount, type RosterRow } from '@/modules/results';
import { CSV_BOM, CSV_CONTENT_TYPE, REPORT_FORMATS } from '@/modules/teacher/constants/class-reports.constants';
import { useClassExports } from '@/modules/teacher/hooks/useClassExports';
import { useReportCsvLabels } from '@/modules/teacher/hooks/useReportCsvLabels';
import { useStudentReportLabels } from '@/modules/teacher/hooks/useStudentReportLabels';
import { toClassRowView } from '@/modules/teacher/lib/classes-directory';
import { classSummaryCsv } from '@/modules/teacher/lib/export/class-summary-csv';
import { csvFilename } from '@/modules/teacher/lib/export/csv';
import { studentReportsCsv } from '@/modules/teacher/lib/export/student-reports-csv';
import { writeClassSummaryWindow } from '@/modules/teacher/lib/print/class-summary-print';
import {
  buildStudentReportsHtml,
  scoredRosterRows,
  scoredStudentInputs,
} from '@/modules/teacher/lib/print/student-report-print';
import { saveTeacherExportFile, saveTextFile } from '@/modules/teacher/lib/teacher-export-download';
import { teachingInsights } from '@/modules/teacher/lib/v2/teaching-insights';
import { useTeacherExportMutation } from '@/modules/teacher/queries/use-teacher-export.mutation';
import { useClassOverlaysStore } from '@/modules/teacher/stores/use-class-overlays-store';
import type { ClassReportsApi, ReportFormat, ReportKind } from '@/modules/teacher/types/class-reports.types';
import type { DashboardClass } from '@/modules/teacher/types/teacher.types';

/**
 * The "Reports and data" modal (design S30, `rpGenerate` l.4485) on real data only:
 * - Student reports · PDF/Print: one page per scored student in ONE print window,
 *   from the class roster read; · CSV: one record per roster student.
 * - Class summary · PDF/Print: the Classes list's class report (`useClassExports`);
 *   · CSV: the Teaching insights view model over the same roster.
 * - Data for AI: the server's de-identified Markdown under its own filenames — the class
 *   summary (`GET /api/teacher/classes/:id/export/insights`, the Classes list's LLM file),
 *   then one profile per scored student (`…/students/:sid/export`).
 * Every option writes a file or opens a document; a failure toasts and keeps the modal open.
 */
export function useClassReports(classCard: DashboardClass, rows: readonly RosterRow[]): ClassReportsApi {
  const locale = useLocale();
  const t = useTranslations('TeacherPortal.reports');
  const close = useClassOverlaysStore((state) => state.close);
  const classExports = useClassExports();
  const csvLabels = useReportCsvLabels();
  const labelsFor = useStudentReportLabels(classCard.name);
  const llm = useTeacherExportMutation();
  const [kind, setKind] = useState<ReportKind>('student');
  const [format, setFormat] = useState<ReportFormat>('pdf');
  const [isPending, setIsPending] = useState(false);
  const { scored } = scoredCount(rows);
  const name = classCard.name;
  const report = t(`kinds.${kind}.label`);

  const printStudents = (mode: 'pdf' | 'print') => {
    const target = window.open('', '_blank');
    if (target === null) {
      showOpsToast({ tone: 'error', message: t('toast.popupBlocked') });
      return;
    }
    try {
      const date = new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(new Date());
      const pages = scoredStudentInputs(rows, { className: name, date, lang: locale }).map((input) => ({
        input,
        labels: labelsFor(input.name, date, input.detail),
      }));
      const doc = { title: t('print.studentsTitle', { name }), lang: locale };
      writeClassSummaryWindow(target, buildStudentReportsHtml(pages, doc));
    } catch {
      target.close();
      showOpsToast({ tone: 'error', message: t('toast.failed', { report, name }) });
      return;
    }
    showOpsToast({ tone: 'ok', message: t(mode === 'pdf' ? 'toast.pdfOpened' : 'toast.printOpened', { report, name }) });
    close();
  };

  const saveCsv = () => {
    const csv =
      kind === 'student'
        ? studentReportsCsv(rows, csvLabels.students)
        : classSummaryCsv(teachingInsights(rows), csvLabels.classSummary);
    const filename = csvFilename(name, kind === 'student' ? 'student-reports' : 'class-summary');
    saveTextFile(`${CSV_BOM}${csv}`, filename, CSV_CONTENT_TYPE);
    showOpsToast({ tone: 'ok', message: t('toast.csvSaved', { report, name }) });
    close();
  };

  const saveAiFiles = async () => {
    const classDocumentId = classCard.class_document_id;
    const requests = [
      { kind: 'insights' as const, classDocumentId },
      ...scoredRosterRows(rows).map((row) => ({
        kind: 'student' as const,
        classDocumentId,
        studentDocumentId: row.student.document_id,
      })),
    ];
    let saved = 0;
    for (const request of requests) {
      const file = await llm.mutateAsync(request).catch(() => null);
      if (file === null) continue;
      saveTeacherExportFile(file);
      saved += 1;
    }
    return { saved, total: requests.length };
  };

  const generateAi = () => {
    setIsPending(true);
    saveAiFiles()
      .then(({ saved, total }) => {
        if (saved === total) {
          showOpsToast({ tone: 'ok', message: t('toast.aiSaved', { count: saved - 1 }) });
          close();
          return;
        }
        showOpsToast({ tone: 'error', message: t('toast.aiFailed', { failed: total - saved, total }) });
      })
      .finally(() => setIsPending(false));
  };

  const generate = () => {
    if (scored === 0 || isPending) return;
    if (kind === 'ai') generateAi();
    else if (format === 'csv') saveCsv();
    else if (kind === 'student') printStudents(format === 'print' ? 'print' : 'pdf');
    else {
      classExports.downloadPdf(toClassRowView(classCard));
      close();
    }
  };

  const pickKind = (next: ReportKind) => {
    setKind(next);
    setFormat(REPORT_FORMATS[next][0] ?? 'pdf');
  };

  return { kind, format, formats: REPORT_FORMATS[kind], scored, isPending, pickKind, pickFormat: setFormat, generate };
}
