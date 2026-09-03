import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { SCREENSHOTS, signInTeacher } from './helpers/teacher-rail';
import {
  openFirstClass,
  readClassStudentsLive,
  readLiveResults,
  signedInTeacherPage,
  type LiveResults,
} from './helpers/teacher-results-live';
import {
  expectStudentRows,
  studentCell,
  studentRow,
  studentsLabel,
} from './helpers/teacher-students-table';

// Task 041 — the Students tab table, proven against the RUNNING app on :3000 and
// the REAL Strapi. Every expected value is read live from C-TR-1 and compared to
// the rendered DOM (see helpers/teacher-students-table.ts); there is no fixture
// and no expected-number literal, so a contract drift fails this file.

test.describe.configure({ mode: 'serial' });

let live: LiveResults;
let page: Page;

const classDetailPath = (documentId: string) => `/dashboard/results/${documentId}`;
const drillDownPath = (classId: string, studentId: string) =>
  `${classDetailPath(classId)}/students/${studentId}`;

/**
 * Opens one class detail and waits for READY. Used to come BACK after a row
 * activation has left the Results surface, so no assertion can land on a loading
 * frame or on the error branch.
 */
async function openClassDetail(documentId: string, target: Page = page): Promise<void> {
  await target.goto(classDetailPath(documentId));
  await expect(target.locator('[data-surface="teacher-class-results"]')).toHaveAttribute(
    'data-status',
    'ready',
    { timeout: 20_000 },
  );
}

test.beforeAll(async ({ browser, playwright }) => {
  live = await readLiveResults(playwright);
  page = await signedInTeacherPage(browser);
  await openFirstClass(page, live);
});

test.afterAll(async () => {
  await page.close();
});

test.describe('Students tab (C-TR-1)', () => {
  test('two-level header: Test A and Test B each span Status · Score · ACARA', async () => {
    const table = page.locator('[data-slot="students-results-table"]');
    await expect(table).toBeVisible();

    const student = table.locator('thead tr').first().locator('th').first();
    await expect(student).toHaveText(studentsLabel('student'));
    await expect(student).toHaveAttribute('scope', 'col');
    await expect(student).toHaveAttribute('rowspan', '2');

    for (const [index, key] of [
      [1, 'testA'],
      [2, 'testB'],
    ] as const) {
      const group = table.locator('thead tr').first().locator('th').nth(index);
      await expect(group).toHaveText(studentsLabel(key));
      await expect(group).toHaveAttribute('scope', 'colgroup');
      await expect(group).toHaveAttribute('colspan', '3');
    }

    const subHeads = table.locator('thead tr').nth(1).locator('th');
    await expect(subHeads).toHaveCount(6);
    await expect(subHeads).toHaveText([
      studentsLabel('status'),
      studentsLabel('score'),
      studentsLabel('acara'),
      studentsLabel('status'),
      studentsLabel('score'),
      studentsLabel('acara'),
    ]);
    for (let index = 0; index < 6; index += 1) {
      await expect(subHeads.nth(index)).toHaveAttribute('scope', 'col');
    }
  });

  test('every real student renders the server status, score and ACARA per test', async () => {
    await expectStudentRows(page, live.detail);

    await page.screenshot({
      path: path.join(SCREENSHOTS, 'task-041-students-tab-table.png'),
      animations: 'disabled',
      fullPage: true,
    });
  });

  test('another journey class renders its own states, including a test nobody started', async ({
    browser,
    playwright,
  }) => {
    const teacherEmail = 't3@schooltest.local';
    const otherLive = await readLiveResults(playwright, teacherEmail);
    const other = otherLive.classes[0];
    const detail = await readClassStudentsLive(playwright, other.class_document_id, teacherEmail);
    expect(detail.students.some((student) => student.test_b.state === 'not_started')).toBe(true);

    const otherPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    try {
      await signInTeacher(otherPage, teacherEmail);
      await openClassDetail(other.class_document_id, otherPage);
      await expectStudentRows(otherPage, detail);
      await otherPage.screenshot({
        path: path.join(SCREENSHOTS, 'task-041-students-tab-second-class.png'),
        animations: 'disabled',
        fullPage: true,
      });
    } finally {
      await otherPage.close();
    }
  });

  test('a row activates by KEYBOARD through to that student’s drill-down', async () => {
    await openClassDetail(live.detail.class.document_id);
    const first = live.detail.students[0];
    const row = studentRow(page, first.student_document_id);
    const link = row.locator('th[scope="row"] a');

    const href = drillDownPath(live.detail.class.document_id, first.student_document_id);
    await expect(link).toHaveAttribute('href', new RegExp(`${href}$`));

    const box = await row.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);

    await link.focus();
    await expect(link).toBeFocused();
    await page.keyboard.press('Enter');
    await page.waitForURL(`**${href}`);
    expect(new URL(page.url()).pathname.endsWith(href)).toBe(true);
  });

  test('clicking anywhere in the row — not just the name — reaches the same student', async () => {
    await openClassDetail(live.detail.class.document_id);
    const last = live.detail.students[live.detail.students.length - 1];

    // A real pointer click at the coordinates of the LAST cell of the row, not a
    // synthetic click on the anchor. Playwright's actionability check proves the
    // point on the way past: `locator.click()` on that cell is refused because the
    // row link's overlay intercepts the pointer there — which is exactly the
    // wireframe's "clickable row", served by ONE real, keyboard-reachable anchor.
    const cell = studentCell(studentRow(page, last.student_document_id), 'acara', 'B');
    await cell.scrollIntoViewIfNeeded();
    const box = await cell.boundingBox();
    if (!box) throw new Error('[e2e] the last row of the Students table has no box');
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

    const href = drillDownPath(live.detail.class.document_id, last.student_document_id);
    await page.waitForURL(`**${href}`);
    expect(new URL(page.url()).pathname.endsWith(href)).toBe(true);
  });
});
