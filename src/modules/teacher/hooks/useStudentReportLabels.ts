'use client';

import { useLocale, useTranslations } from 'next-intl';

import type { StudentReportLabels } from '@/modules/teacher/types/class-summary-print.types';
import type { StudentDetailView } from '@/modules/teacher/types/v2-student-detail.types';

/**
 * The printed student reading report's words (`TeacherPortal.students.print`),
 * shared by the Students tab's row PDF and the Reports modal's "Student reports".
 * The footer counts the student's own sittings since their first one on record.
 */
export function useStudentReportLabels(
  className: string,
): (name: string, date: string, detail: StudentDetailView) => StudentReportLabels {
  const locale = useLocale();
  const t = useTranslations('TeacherPortal.students');
  const tVm = useTranslations('TeacherPortal.viewModel');
  const tKit = useTranslations('TeacherPortal.kit');

  const footer = (date: string, { count, since }: StudentDetailView['tiles']['sittings']) => {
    const time = since === null ? Number.NaN : Date.parse(since);
    if (count === 0 || Number.isNaN(time)) return t('print.footer', { name: className, date });
    const month = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(time);
    return t('print.footerSittings', { name: className, date, count, since: month });
  };

  return (name, date, detail) => ({
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
}
