import { describe, expect, test } from 'vitest';

import en from '@/i18n/messages/en.json';
import { scoredCount } from '@/modules/results';
import { parseCsv } from '@/modules/teacher/lib/export/__fixtures__/parse-csv';
import { classSummaryCsv } from '@/modules/teacher/lib/export/class-summary-csv';
import { t2Roster } from '@/modules/teacher/lib/v2/__fixtures__/t2';
import { teachingInsights } from '@/modules/teacher/lib/v2/teaching-insights';
import type { ClassSummaryCsvLabels } from '@/modules/teacher/types/class-reports.types';

// Fixture: the class roster GET /api/my/students/results?class= recorded from the live
// API (:5500) as t2 on 2026-09-11, through the Teaching insights view model.
const csv = en.TeacherPortal.reports.csv;

function viewModel(key: string): string {
  const found = key
    .split('.')
    .reduce<unknown>(
      (node, part) => (typeof node === 'object' && node !== null ? (node as Record<string, unknown>)[part] : undefined),
      en.TeacherPortal.viewModel,
    );
  if (typeof found !== 'string') throw new Error(`no TeacherPortal.viewModel.${key}`);
  return found;
}

const labels: ClassSummaryCsvLabels = { ...csv, viewModel };
const cell = (value: number | null) => (value === null ? '' : String(value));

/** The data records under one titled table, up to the empty separator record. */
function table(records: string[][], title: string): string[][] {
  const start = records.findIndex((record) => record[0] === title);
  const end = records.findIndex((record, index) => index > start && record.every((field) => field === ''));
  return records.slice(start + 2, end === -1 ? undefined : end).map((record) => record.filter((_, index) => index < 6));
}

describe('classSummaryCsv — the recorded t2 roster', () => {
  const view = teachingInsights(t2Roster);
  const records = parseCsv(classSummaryCsv(view, labels));
  const { scored, total } = scoredCount(t2Roster);

  test('three titled tables, every record six fields wide', () => {
    expect(records.map((record) => record[0])).toEqual(expect.arrayContaining([csv.averages, csv.phases, csv.subskills]));
    expect(new Set(records.map((record) => record.length))).toEqual(new Set([6]));
  });

  test('class averages: the class average, the scored and roster counts, the mean shift, the top gap', () => {
    expect(table(records, csv.averages).map((record) => record.slice(0, 2))).toEqual([
      [csv.classAverage, cell(view.kpis.classAverage)],
      [csv.scored, String(scored)],
      [csv.roster, String(total)],
      [csv.upSinceLast, cell(view.kpis.upSinceLast.value)],
      [csv.paired, String(view.kpis.upSinceLast.paired)],
      [csv.topGap, view.kpis.topGap === null ? '' : viewModel(view.kpis.topGap.labelKey)],
    ]);
    expect(view.kpis.classAverage).toBe(41);
    expect(view.kpis.topGap?.skill).toBe('Vocabulary');
  });

  test('ACARA phase spread: four phases, counts summing to the phased students', () => {
    const phases = table(records, csv.phases);
    expect(phases.map((record) => record[0])).toEqual(view.cohort.phases.map((bar) => viewModel(bar.labelKey)));
    expect(phases.reduce((sum, record) => sum + Number(record[1]), 0)).toBe(view.cohort.phased);
    expect(phases.map((record) => record[2])).toEqual(view.cohort.phases.map((bar) => String(bar.width)));
  });

  test('subskill gaps: the seven mastery rows in ranked order, class focus first', () => {
    const subskills = table(records, csv.subskills);
    expect(subskills.map((record) => record[0])).toEqual(view.mastery.map((row) => viewModel(row.labelKey)));
    expect(subskills[0]?.[5]).toBe(viewModel('flag.classFocus'));
    expect(subskills.map((record) => record.slice(1, 5))).toEqual(
      view.mastery.map((row) => [cell(row.mean), String(row.assessed), cell(row.secure), cell(row.gatePassed)]),
    );
  });
});

describe('classSummaryCsv — edge case derived from the recorded roster', () => {
  test('a roster with no scored student leaves every measured value empty, never zero', () => {
    const unscored = t2Roster.map((row) => ({ ...row, result: null }));
    const records = parseCsv(classSummaryCsv(teachingInsights(unscored), labels));
    const averages = table(records, csv.averages);
    expect(averages[0]).toEqual([csv.classAverage, '', '', '', '', '']);
    expect(averages[2]?.[1]).toBe(String(t2Roster.length));
    expect(table(records, csv.phases).map((record) => record.slice(1, 3))).toEqual(Array(4).fill(['0', '']));
    expect(table(records, csv.subskills).map((record) => record[1])).toEqual(Array(7).fill(''));
  });
});
