import type { DisplaySkill } from '@schooltest/scoring-contracts';
import { describe, expect, test } from 'vitest';

import en from '@/i18n/messages/en.json';
import { DISPLAY_SKILL_ORDER } from '@/modules/results';
import { SKILL_LABEL_KEY } from '@/modules/teacher/constants/v2-i18n.constants';
import { parseCsv } from '@/modules/teacher/lib/export/__fixtures__/parse-csv';
import { studentReportsCsv } from '@/modules/teacher/lib/export/student-reports-csv';
import { t2Roster, t2Row } from '@/modules/teacher/lib/v2/__fixtures__/t2';
import type { StudentReportsCsvLabels } from '@/modules/teacher/types/class-reports.types';

// Fixture: the class roster GET /api/my/students/results?class= recorded from the live
// API (:5500) as t2 on 2026-09-11. Edge cases are derived from recorded rows.
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

const labels: StudentReportsCsvLabels = {
  student: csv.student,
  score: csv.score,
  phase: csv.phase,
  growth: csv.growth,
  skillScore: (skill) => csv.skillScore.replace('{skill}', skill),
  skillBand: (skill) => csv.skillBand.replace('{skill}', skill),
  viewModel,
};

const records = parseCsv(studentReportsCsv(t2Roster, labels));
const [header = [], ...rows] = records;
const recordOf = (name: string) => rows.find((row) => row[0] === name) ?? [];
const skillCells = (record: string[], skill: DisplaySkill) => {
  const at = 4 + DISPLAY_SKILL_ORDER.indexOf(skill) * 2;
  return record.slice(at, at + 2);
};

describe('studentReportsCsv — the recorded t2 roster', () => {
  test('header: student, score, phase, growth, then score and band for each of the seven subskills', () => {
    const skills = DISPLAY_SKILL_ORDER.flatMap((skill) => {
      const name = viewModel(SKILL_LABEL_KEY[skill]);
      return [labels.skillScore(name), labels.skillBand(name)];
    });
    expect(header).toEqual([csv.student, csv.score, csv.phase, csv.growth, ...skills]);
  });

  test('one record per roster student, name A–Z, every record the same width', () => {
    expect(rows).toHaveLength(t2Roster.length);
    expect(rows.map((row) => row[0])).toEqual(
      t2Roster.map((row) => row.student.name).sort((a, b) => a.localeCompare(b)),
    );
    expect(new Set(records.map((record) => record.length))).toEqual(new Set([4 + DISPLAY_SKILL_ORDER.length * 2]));
  });

  test('each score is the served domain score; an unscored student has an empty score', () => {
    for (const row of t2Roster) {
      const score = row.result?.overall.domain_score ?? null;
      expect(recordOf(row.student.name)[1]).toBe(score === null ? '' : String(score));
    }
  });

  test('every subskill score is the served one and every band the API status', () => {
    for (const row of t2Roster) {
      const vocab = row.result?.vocab.blended ?? null;
      expect(skillCells(recordOf(row.student.name), 'Vocabulary')[0]).toBe(vocab === null ? '' : String(vocab));
    }
    const { student, result } = t2Row('Dilnoza');
    const record = recordOf(student.name);
    expect(skillCells(record, 'Inference')).toEqual(['49', viewModel('band.emerging')]);
    expect(skillCells(record, 'Decoding')).toEqual(['25', viewModel('band.notYet')]);
    expect(result?.gate.domain_score ?? null).toBeNull();
    expect(skillCells(record, 'Critical')).toEqual(['', '']);
  });

  test('Dilnoza: served phase and the server growth step (−45 printed as -45)', () => {
    expect(recordOf(t2Row('Dilnoza').student.name).slice(1, 4)).toEqual(['41', viewModel('phase.beginning'), '-45']);
  });

  test('Amara: score-derived phase, the server "steady" growth, the failed exit gate', () => {
    const record = recordOf(t2Row('Amara').student.name);
    expect(record.slice(1, 4)).toEqual(['42', viewModel('phase.beginning'), viewModel('growth.steady')]);
    expect(skillCells(record, 'Critical')[1]).toBe(viewModel('gate.notYet'));
  });
});

describe('studentReportsCsv — edge cases derived from the recorded Dilnoza row', () => {
  test('a student with no result keeps only the name, never a zero', () => {
    const row = t2Row('Dilnoza');
    const [, record = []] = parseCsv(studentReportsCsv([{ ...row, result: null }], labels));
    expect(record).toEqual([row.student.name, ...Array<string>(3 + DISPLAY_SKILL_ORDER.length * 2).fill('')]);
  });

  test('a name a spreadsheet would evaluate is neutralised, quoted and read back intact', () => {
    const row = t2Row('Dilnoza');
    const name = `=HYPERLINK("${row.student.name}")`;
    const [, record = []] = parseCsv(studentReportsCsv([{ ...row, student: { ...row.student, name } }], labels));
    expect(record[0]).toBe(`'${name}`);
  });

  test('an empty roster is the header alone', () => {
    expect(parseCsv(studentReportsCsv([], labels))).toEqual([header]);
  });
});
