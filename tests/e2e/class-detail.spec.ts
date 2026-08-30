import path from 'node:path';

import { expect, test } from '@playwright/test';

import {
  ACARA_PHASES,
  apiClassDetail,
  fullName,
  gotoClassDetail,
  schoolAdminJwt,
  studentWithEvidence,
} from './helpers/class-detail';
import { cat, loadMessages } from './helpers/i18n';
import { loginAs } from './helpers/roles';
import { watchErrors } from './helpers/ui';

// Spec §1 — the redesigned class detail page, against the REAL running app and
// the REAL API. Every rendered figure is cross-checked against the live C-CLS-05
// body, so the page can never drift from the contract without failing here.
const en = loadMessages('en');
const SCREENSHOTS = path.resolve(process.cwd(), '.qa', 'screenshots');

test.describe.configure({ mode: 'serial' });

test.describe('class detail (spec §1)', () => {
  test('flow 1: a school_admin reaches the class detail from the Classes list', async ({
    page,
  }) => {
    await loginAs(page, 'schoolAdmin');
    const detail = await apiClassDetail(page.request, await schoolAdminJwt(page.request));

    await page.goto('/dashboard/school/classes');
    await page
      .getByRole('link', { name: detail.name ?? '', exact: true })
      .first()
      .click();
    await page.waitForURL(/\/dashboard\/school\/classes\/[a-z0-9]+$/);
    await expect(page.getByRole('heading', { level: 1, name: detail.name ?? '' })).toBeVisible();
  });

  test('flow 2: the header shows the assigned teacher and the student count', async ({ page }) => {
    await loginAs(page, 'schoolAdmin');
    const detail = await apiClassDetail(page.request, await schoolAdminJwt(page.request));
    await gotoClassDetail(page);

    const surface = page.locator('[data-surface="school-admin-class-detail"]');
    // Exactly ONE h1, and it is the class name.
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(detail.name ?? '');

    const teacher = detail.teacher;
    const teacherName = teacher
      ? [teacher.first_name, teacher.last_name].filter(Boolean).join(' ').trim()
      : cat(en, 'Classes.detail.teacherUnassigned');
    await expect(surface).toContainText(teacherName);
    await expect(surface).toContainText(
      `${detail.student_count} ${detail.student_count === 1 ? 'student' : 'students'}`,
    );

    await expect(
      page.getByRole('button', { name: cat(en, 'Classes.detail.editClass') }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: cat(en, 'Classes.detail.importStudents') }),
    ).toBeVisible();
  });

  test('flow 3: the four summary cards equal the live C-CLS-05 summary', async ({ page }) => {
    await loginAs(page, 'schoolAdmin');
    const { summary } = await apiClassDetail(page.request, await schoolAdminJwt(page.request));
    await gotoClassDetail(page);

    const card = (label: string) =>
      page.locator('[data-slot="metric-card"]').filter({ hasText: label });

    await expect(card(cat(en, 'Classes.detail.summary.students'))).toContainText(
      String(summary.students),
    );
    await expect(card(cat(en, 'Classes.detail.summary.testACompleted'))).toContainText(
      `${summary.test_a_completed} / ${summary.students}`,
    );
    await expect(card(cat(en, 'Classes.detail.summary.testBCompleted'))).toContainText(
      `${summary.test_b_completed} / ${summary.students}`,
    );
    await expect(card(cat(en, 'Classes.detail.summary.avgReadingScore'))).toContainText(
      summary.avg_reading_score === null ? '—' : String(summary.avg_reading_score),
    );
  });

  test('flow 4: the roster table renders every student, in the API order, with real results', async ({
    page,
  }) => {
    const errors = watchErrors(page);
    await loginAs(page, 'schoolAdmin');
    const detail = await apiClassDetail(page.request, await schoolAdminJwt(page.request));
    await gotoClassDetail(page);

    const rows = page.locator('[data-surface="school-admin-class-detail"] tbody tr');
    await expect(rows).toHaveCount(detail.students.length);

    // Row order matches the server's order, name for name.
    const rendered = await rows.locator('td:first-child').allInnerTexts();
    expect(rendered.map((value) => value.trim())).toEqual(detail.students.map(fullName));

    // A completed Test A renders Done + its real score + its real phase. The
    // student is selected BECAUSE their Test A carries evidence, so every
    // assertion below runs unconditionally — a row that lost its score or phase
    // fails here rather than skipping.
    const done = studentWithEvidence(detail, 'A');
    expect(done, 'no student with a scored Test A — the fixture seed must run first').toBeTruthy();
    const testA = done!.tests.find((test) => test.test_id === 'A');
    expect(testA?.status).toBe('completed');
    const doneRow = rows.filter({ hasText: fullName(done!) }).first();
    await expect(doneRow).toContainText(cat(en, 'Classes.detail.table.statusDone'));
    await expect(doneRow).toContainText(String(testA!.overall_score));
    await expect(doneRow).toContainText(testA!.acara_phase!);

    // An in-progress sitting is its OWN state, never mislabelled "Not started".
    const inProgress = detail.students.find((student) =>
      student.tests.some((test) => test.status === 'in_progress'),
    );
    if (inProgress) {
      await expect(rows.filter({ hasText: fullName(inProgress) }).first()).toContainText(
        cat(en, 'Classes.detail.table.statusInProgress'),
      );
    }

    expect(errors).toEqual([]);
    await page.screenshot({
      path: path.join(SCREENSHOTS, 'class-detail-desktop.png'),
      fullPage: true,
    });
  });

  test('flow 5: the removed surfaces are gone and ACARA never reads "Phase N"', async ({
    page,
  }) => {
    await loginAs(page, 'schoolAdmin');
    await gotoClassDetail(page);
    const surface = page.locator('[data-surface="school-admin-class-detail"]');

    // No teacher/student checkboxes and no bulk save on this surface. Asserted
    // against the SURFACE's own buttons, not the document, so a dialog's Save
    // (which is a different, legitimate control) cannot make this pass by
    // being closed.
    await expect(surface.locator('input[type="checkbox"], [role="checkbox"]')).toHaveCount(0);
    const surfaceButtons = await surface.getByRole('button').allInnerTexts();
    expect(surfaceButtons.map((label) => label.trim())).not.toContain(
      cat(en, 'Classes.detail.edit.save'),
    );
    const text = await surface.innerText();
    expect(text.toLowerCase()).not.toContain('children');
    expect(text).not.toContain('No active children');

    // Every ACARA cell is a canonical phase label or the em dash — never "Phase 1".
    expect(text).not.toMatch(/Phase\s*\d/);
    const acaraCells = await surface
      .locator('tbody tr td:nth-child(4), tbody tr td:nth-child(7)')
      .allInnerTexts();
    for (const cell of acaraCells) {
      const value = cell.trim();
      expect(
        value === '—' || (ACARA_PHASES as readonly string[]).includes(value),
        `unexpected ACARA cell "${value}"`,
      ).toBe(true);
    }
  });
});
