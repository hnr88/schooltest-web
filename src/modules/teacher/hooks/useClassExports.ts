'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { showOpsToast } from '@/modules/ops/actions';
import { classResultsQueryOptions } from '@/modules/results';
import { downloadClassExportMarkdown } from '@/modules/teach';
import { useYearLabel } from '@/modules/teacher/hooks/useClassesDirectory';
import { summariseClassResults } from '@/modules/teacher/lib/print/class-summary';
import {
  buildClassSummaryHtml,
  writeClassSummaryWindow,
} from '@/modules/teacher/lib/print/class-summary-print';
import type { ClassSummaryLabels } from '@/modules/teacher/types/class-summary-print.types';
import type {
  ClassExportPending,
  ClassExportsApi,
  ClassRowView,
} from '@/modules/teacher/types/classes-screen.types';

/**
 * The Classes list's two exports, both real:
 * - PDF: the class reading report printed from the roster read
 *   (`GET /api/my/students/results?class=`, the results module's own query
 *   options), in a window opened inside the click so no pop-up blocker fires;
 * - LLM: the server's de-identified class markdown
 *   (`GET /api/schools/me/classes/:id/export.md`).
 * Failures surface as toasts; nothing reports a success it did not have.
 */
export function useClassExports(): ClassExportsApi {
  const queryClient = useQueryClient();
  const locale = useLocale();
  const t = useTranslations('TeacherPortal.classes');
  const tKit = useTranslations('TeacherPortal.kit');
  const tResults = useTranslations('Results');
  const yearLabel = useYearLabel();
  const [pending, setPending] = useState<ClassExportPending | null>(null);

  const labelsFor = (name: string, date: string): ClassSummaryLabels => ({
    title: t('print.title', { name }),
    assessment: t('print.assessment'),
    brand: t('print.brand'),
    meanReading: t('print.meanReading'),
    students: t('print.students'),
    growth: t('print.growth'),
    subskillProfile: t('print.subskillProfile'),
    subskill: t('print.subskill'),
    mean: t('print.mean'),
    atSecure: t('print.atSecure'),
    focus: t('print.focus'),
    strength: t('print.strength'),
    gap: t('print.gap'),
    growthSince: t('print.growthSince'),
    improved: t('print.improved'),
    held: t('print.held'),
    slipped: t('print.slipped'),
    vocabulary: t('print.vocabulary'),
    everyday: t('print.everyday'),
    academic: t('print.academic'),
    footer: t('print.footer', { name, date }),
    noValue: tKit('noValue'),
    secureOf: (secure, assessed) => t('print.secureOf', { secure, assessed }),
    skill: (skill) => tResults(`skill${skill}`),
  });

  const printReport = async (row: ClassRowView, target: Window) => {
    const rows = await queryClient.fetchQuery(classResultsQueryOptions(row.id));
    const summary = summariseClassResults(rows);
    if (summary.scored === 0) {
      target.close();
      showOpsToast({ tone: 'warn', message: t('export.noScores', { name: row.name }) });
      return;
    }
    const date = new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(new Date());
    const input = { className: row.name, yearLabel: yearLabel(row.year), date, lang: locale, summary };
    writeClassSummaryWindow(target, buildClassSummaryHtml(input, labelsFor(row.name, date)));
  };

  const downloadPdf = (row: ClassRowView) => {
    const target = window.open('', '_blank');
    if (target === null) {
      showOpsToast({ tone: 'error', message: t('export.popupBlocked') });
      return;
    }
    setPending({ id: row.id, kind: 'pdf' });
    printReport(row, target)
      .catch(() => {
        target.close();
        showOpsToast({ tone: 'error', message: t('export.failed', { name: row.name }) });
      })
      .finally(() => setPending(null));
  };

  const downloadLlm = (row: ClassRowView) => {
    setPending({ id: row.id, kind: 'llm' });
    downloadClassExportMarkdown(row.id)
      .catch(() => showOpsToast({ tone: 'error', message: t('export.llmFailed', { name: row.name }) }))
      .finally(() => setPending(null));
  };

  return { downloadPdf, downloadLlm, pending };
}
