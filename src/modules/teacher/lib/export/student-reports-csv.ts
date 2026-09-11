import { DISPLAY_SKILL_ORDER, type RosterRow } from '@/modules/results';

import { GROWTH_STEADY_KEY, SKILL_LABEL_KEY } from '@/modules/teacher/constants/v2-i18n.constants';
import { toCsv } from '@/modules/teacher/lib/export/csv';
import { studentsTabRow } from '@/modules/teacher/lib/v2/students-tab';
import { subskillCards } from '@/modules/teacher/lib/v2/subskill-cards';
import type { CsvCell, StudentReportsCsvLabels } from '@/modules/teacher/types/class-reports.types';
import type { SubskillCard } from '@/modules/teacher/types/v2-student-detail.types';
import type { GrowthView } from '@/modules/teacher/types/v2-view-common.types';

/**
 * "Student reports" as CSV: one record per ROSTER student, name A–Z, from the
 * class roster read (`GET /api/my/students/results?class=`). Score, ACARA phase
 * and growth are the Students tab's own view model (`studentsTabRow`); the seven
 * subskills are the student page's cards (`subskillCards`) — score plus the API
 * band, or the exit-gate state for Critical reading. A student without a result
 * keeps empty fields, never a zero.
 */

function growthCell(growth: GrowthView, labels: StudentReportsCsvLabels): CsvCell {
  return growth.kind === 'steady' ? labels.viewModel(GROWTH_STEADY_KEY) : growth.points;
}

function skillCells(card: SubskillCard | undefined, labels: StudentReportsCsvLabels): CsvCell[] {
  if (card === undefined) return [null, null];
  const state = card.band ?? card.gate;
  return [card.score, state === null ? null : labels.viewModel(state.labelKey)];
}

export function studentReportsCsv(roster: readonly RosterRow[], labels: StudentReportsCsvLabels): string {
  const header: CsvCell[] = [
    labels.student,
    labels.score,
    labels.phase,
    labels.growth,
    ...DISPLAY_SKILL_ORDER.flatMap((skill) => {
      const name = labels.viewModel(SKILL_LABEL_KEY[skill]);
      return [labels.skillScore(name), labels.skillBand(name)];
    }),
  ];
  const records = [...roster]
    .sort((a, b) => a.student.name.localeCompare(b.student.name))
    .map((row): CsvCell[] => {
      const view = studentsTabRow(row);
      const cards = row.result === null ? [] : subskillCards(row.result);
      return [
        view.name,
        view.score,
        view.phase === null ? null : labels.viewModel(view.phase.labelKey),
        growthCell(view.growth, labels),
        ...DISPLAY_SKILL_ORDER.flatMap((skill) => skillCells(cards.find((card) => card.skill === skill), labels)),
      ];
    });
  return toCsv([header, ...records]);
}
