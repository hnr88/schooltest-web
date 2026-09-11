import { toCsv } from '@/modules/teacher/lib/export/csv';
import type { ClassSummaryCsvLabels, CsvCell } from '@/modules/teacher/types/class-reports.types';
import type { MasteryRow, TeachingInsightsView } from '@/modules/teacher/types/v2-insights.types';

/**
 * "Class summary" as CSV — the Teaching insights view model (`teachingInsights()`)
 * over the class roster read, in three titled tables separated by an empty
 * record: the class averages, the ACARA phase spread and the subskill gaps
 * (ranked as the tab ranks them: class focus first). A value the roster cannot
 * support stays an empty field.
 */

function subskillRecord(row: MasteryRow, labels: ClassSummaryCsvLabels): CsvCell[] {
  return [
    labels.viewModel(row.labelKey),
    row.mean,
    row.assessed,
    row.secure,
    row.gatePassed,
    row.flag === null ? null : labels.viewModel(row.flag.labelKey),
  ];
}

export function classSummaryCsv(view: TeachingInsightsView, labels: ClassSummaryCsvLabels): string {
  const { kpis, cohort, mastery } = view;
  return toCsv([
    [labels.averages],
    [labels.measure, labels.value],
    [labels.classAverage, kpis.classAverage],
    [labels.scored, kpis.participation.scored],
    [labels.roster, kpis.participation.total],
    [labels.upSinceLast, kpis.upSinceLast.value],
    [labels.paired, kpis.upSinceLast.paired],
    [labels.topGap, kpis.topGap === null ? null : labels.viewModel(kpis.topGap.labelKey)],
    [],
    [labels.phases],
    [labels.phase, labels.students, labels.share],
    ...cohort.phases.map((bar): CsvCell[] => [
      labels.viewModel(bar.labelKey),
      bar.count,
      cohort.phased === 0 ? null : bar.width,
    ]),
    [],
    [labels.subskills],
    [labels.subskill, labels.mean, labels.assessed, labels.secure, labels.gatePassed, labels.flag],
    ...mastery.map((row) => subskillRecord(row, labels)),
  ]);
}
