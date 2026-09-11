'use client';

import { useTranslations } from 'next-intl';

import type { ClassSummaryCsvLabels, StudentReportsCsvLabels } from '@/modules/teacher/types/class-reports.types';

/** The Reports modal's CSV header words (`TeacherPortal.reports.csv`) plus the view-model resolver. */
export function useReportCsvLabels(): { students: StudentReportsCsvLabels; classSummary: ClassSummaryCsvLabels } {
  const t = useTranslations('TeacherPortal.reports.csv');
  const tVm = useTranslations('TeacherPortal.viewModel');
  const viewModel = (key: string) => tVm(key);

  return {
    students: {
      student: t('student'),
      score: t('score'),
      phase: t('phase'),
      growth: t('growth'),
      skillScore: (skill) => t('skillScore', { skill }),
      skillBand: (skill) => t('skillBand', { skill }),
      viewModel,
    },
    classSummary: {
      averages: t('averages'),
      measure: t('measure'),
      value: t('value'),
      classAverage: t('classAverage'),
      scored: t('scored'),
      roster: t('roster'),
      upSinceLast: t('upSinceLast'),
      paired: t('paired'),
      topGap: t('topGap'),
      phases: t('phases'),
      phase: t('phase'),
      students: t('students'),
      share: t('share'),
      subskills: t('subskills'),
      subskill: t('subskill'),
      mean: t('mean'),
      assessed: t('assessed'),
      secure: t('secure'),
      gatePassed: t('gatePassed'),
      flag: t('flag'),
      viewModel,
    },
  };
}
