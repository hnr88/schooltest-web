import { expect, type Locator, type Page } from '@playwright/test';

import type {
  ClassStudentsResponse,
  StudentTestCell,
} from '@/modules/teacher/types/teacher-result.types';

import { cat } from './i18n';
import { en } from './teacher-rail';

// Task 041 harness for the Students tab table. Everything asserted here is
// compared against a C-TR-1 body read live from the same Strapi the browser talks
// to, so there is no expected-value literal: the per-cell state, score and ACARA
// phase come from the server, and a drift fails the spec.

/** The wire `state` -> the i18n key whose WORD the pill must print (WCAG 1.4.1). */
const STATE_KEY = {
  done: 'stateDone',
  stalled: 'stateStalled',
  in_progress: 'stateInProgress',
  not_started: 'stateNotStarted',
} as const;

export const studentsLabel = (key: string): string =>
  cat(en, `Teacher.results.students.${key}`);

export const studentRow = (page: Page, studentDocumentId: string): Locator =>
  page.locator(`[data-slot="student-results-row"][data-student-id="${studentDocumentId}"]`);

export const studentCell = (row: Locator, slot: string, variant: 'A' | 'B'): Locator =>
  row.locator(`[data-slot="student-test-${slot}"][data-variant="${variant}"]`);

/** How many `—` cells the SERVER's own nulls require — never a guessed count. */
const missingIn = (cell: StudentTestCell): number =>
  (cell.score === null ? 1 : 0) + (cell.acara_phase === null ? 1 : 0);

/**
 * Every row of one class, cell by cell, against that class's live C-TR-1 body.
 * A `null` score / ACARA phase must render the em dash WITH its readable words —
 * never a 0, never a blank, never a guessed phase.
 */
export async function expectStudentRows(
  page: Page,
  detail: ClassStudentsResponse,
): Promise<void> {
  await expect(page.locator('[data-slot="student-results-row"]')).toHaveCount(
    detail.students.length,
  );

  for (const student of detail.students) {
    const row = studentRow(page, student.student_document_id);
    await expect(row.locator('th[scope="row"]')).toContainText(student.display_name);

    for (const [variant, cell] of [
      ['A', student.test_a],
      ['B', student.test_b],
    ] as const) {
      const state = studentCell(row, 'state', variant);
      await expect(state).toHaveText(studentsLabel(STATE_KEY[cell.state]));
      await expect(state).toHaveAttribute('data-state', cell.state);

      const score = studentCell(row, 'score', variant);
      if (cell.score === null) {
        await expect(score.locator('[data-slot="results-missing-value"]')).toContainText(
          studentsLabel('noValueLabel'),
        );
      } else {
        await expect(score).toHaveText(`${cell.score}`);
      }

      const acara = studentCell(row, 'acara', variant);
      if (cell.acara_phase === null) {
        await expect(acara.locator('[data-slot="results-missing-value"]')).toContainText(
          studentsLabel('noValueLabel'),
        );
      } else {
        await expect(acara).toHaveText(cell.acara_phase);
      }
    }
  }

  const expectedMissing = detail.students.reduce(
    (total, student) => total + missingIn(student.test_a) + missingIn(student.test_b),
    0,
  );
  await expect(page.locator('[data-slot="results-missing-value"]')).toHaveCount(expectedMissing);
}
