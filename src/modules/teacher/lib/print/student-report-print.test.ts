import { afterEach, describe, expect, test, vi } from 'vitest';

import en from '@/i18n/messages/en.json';
import t2Dashboard from '@/modules/teacher/lib/__fixtures__/teacher-dashboard.t2.json';
import { escapeHtml, writeClassSummaryWindow } from '@/modules/teacher/lib/print/class-summary-print';
import { buildStudentReportHtml } from '@/modules/teacher/lib/print/student-report-print';
import { t2ResultAmara, t2ResultDilnoza, t2Row } from '@/modules/teacher/lib/v2/__fixtures__/t2';
import { carerReport } from '@/modules/teacher/lib/v2/carer-report';
import { studentDetail } from '@/modules/teacher/lib/v2/student-detail';
import type { StudentReportInput, StudentReportLabels } from '@/modules/teacher/types/class-summary-print.types';

// Fixtures: GET /api/results/:id for Dilnoza and Amara, the class roster and GET
// /api/teacher/dashboard, all recorded from the live API (:5500) as t2 on 2026-09-11.
const print = en.TeacherPortal.students.print;
const className = t2Dashboard.classes[0]?.name ?? '';
const DATE = '11 September 2026';

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

const labels: StudentReportLabels = {
  ...print,
  title: print.title,
  footer: print.footer.replace('{name}', className).replace('{date}', DATE),
  noValue: en.TeacherPortal.kit.noValue,
  points: (signed) => print.points.replace('{value}', signed),
  viewModel,
};

function inputFor(firstName: 'Dilnoza' | 'Amara'): StudentReportInput {
  const result = firstName === 'Dilnoza' ? t2ResultDilnoza : t2ResultAmara;
  const { student } = t2Row(firstName);
  return {
    name: student.name,
    className,
    date: DATE,
    lang: 'en',
    detail: studentDetail(result),
    carer: carerReport(result, student),
  };
}

function render(input: StudentReportInput): Document {
  return new DOMParser().parseFromString(buildStudentReportHtml(input, labels), 'text/html');
}

const texts = (doc: Document, selector: string) =>
  Array.from(doc.querySelectorAll(selector), (node) => node.textContent ?? '');

afterEach(() => {
  document.body.innerHTML = '';
});

describe('buildStudentReportHtml — recorded Dilnoza (41, server phase, reliable −45)', () => {
  const input = inputFor('Dilnoza');
  const doc = render(input);

  test('header: the student, the class, the assessment and the date', () => {
    expect(doc.querySelector('h1')?.textContent).toBe(input.name);
    expect(doc.querySelector('.sub')?.textContent).toBe(`${className} · ${print.assessment} · ${DATE}`);
    expect(doc.querySelector('.brand')?.textContent).toBe(print.brand);
    expect(doc.documentElement.lang).toBe('en');
  });

  test('KPIs print the served score, the server phase and the server growth step', () => {
    expect(texts(doc, '.kpi .l')).toEqual([print.overall, print.phase, print.growth]);
    expect(texts(doc, '.kpi .v')).toEqual(['41%', 'Beginning', '−45 pts']);
  });

  test('one breakdown row per display subskill, banded by the API status; Critical has no gate score', () => {
    const rows = Array.from(doc.querySelectorAll('tbody tr'), (row) =>
      Array.from(row.querySelectorAll('td'), (cell) => cell.textContent),
    );
    expect(rows).toHaveLength(input.detail.subskills.length);
    expect(rows).toContainEqual(['Inference', '49%', 'Emerging']);
    expect(rows).toContainEqual(['Decoding', '25%', 'Not yet']);
    expect(rows).toContainEqual(['Critical reading', '—', '—']);
  });

  test('focus and strengths, vocabulary strands, and the carer lines from carerReport', () => {
    const boxes = texts(doc, '.two .box .v');
    expect(boxes).toEqual(['Inference · 49%', 'Decoding · 25%', '25%', '25%']);
    expect(texts(doc, '[data-list="canDo"] li')).toEqual([en.TeacherPortal.viewModel.carer.can.inference]);
    expect(texts(doc, '[data-list="next"] li')).toEqual(input.carer.next.map((line) => viewModel(line.key)));
    expect(doc.querySelector('.note')).toBeNull();
    expect(doc.querySelector('.foot')?.textContent).toBe(labels.footer);
  });
});

describe('buildStudentReportHtml — recorded Amara (score-derived phase, steady, single strand, gate)', () => {
  const doc = render(inputFor('Amara'));

  test('a score-derived phase, the server "steady" growth and the failed exit gate', () => {
    expect(texts(doc, '.kpi .v')).toEqual(['42%', 'Beginning', viewModel('growth.steady')]);
    const critical = Array.from(doc.querySelectorAll('tbody tr')).find(
      (row) => row.querySelector('td')?.textContent === 'Critical reading',
    );
    expect(critical?.querySelector('.band')?.textContent).toBe(viewModel('gate.notYet'));
  });

  test('the unmeasured A2 strand and an empty can-do list print the dash, never a number', () => {
    expect(texts(doc, '.two .box .v').slice(2)).toEqual(['—', '25%']);
    expect(texts(doc, '[data-list="canDo"] li')).toEqual(['—']);
  });
});

describe('buildStudentReportHtml — edge cases derived from the recorded Dilnoza result', () => {
  test('an EAL/D flag on the recorded student adds the carer note', () => {
    const { student } = t2Row('Dilnoza');
    const input = { ...inputFor('Dilnoza'), carer: carerReport(t2ResultDilnoza, { ...student, eald_flag: true }) };
    expect(render(input).querySelector('.note')?.textContent).toBe(en.TeacherPortal.viewModel.carer.ealdNote);
  });

  test('interpolated text is escaped and the page carries no script', () => {
    const html = buildStudentReportHtml({ ...inputFor('Dilnoza'), name: '<b>"D" & \'B\'</b>' }, labels);
    expect(html).toContain(`<h1>${escapeHtml('<b>"D" & \'B\'</b>')}</h1>`);
    expect(html).not.toContain('<script');
  });

  test('the report is written into the opened window and printed', async () => {
    const frame = document.createElement('iframe');
    document.body.appendChild(frame);
    const target = frame.contentWindow;
    expect(target).not.toBeNull();
    if (target === null) return;
    const printSpy = vi.spyOn(target, 'print').mockImplementation(() => undefined);
    vi.spyOn(target, 'focus').mockImplementation(() => undefined);
    const input = inputFor('Dilnoza');
    writeClassSummaryWindow(target, buildStudentReportHtml(input, { ...labels, title: `Reading report — ${input.name}` }));
    expect(target.document.title).toBe(`Reading report — ${input.name}`);
    expect(target.document.querySelector('h1')?.textContent).toBe(input.name);
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(printSpy).toHaveBeenCalledTimes(1);
  });
});
