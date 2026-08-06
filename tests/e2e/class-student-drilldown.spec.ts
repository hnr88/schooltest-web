import path from 'node:path';

import { expect, test } from '@playwright/test';

import {
  ACARA_PHASES,
  apiClassDetail,
  apiClassStudent,
  fullName,
  gotoClassDetail,
  schoolAdminJwt,
  studentWithEvidence,
} from './helpers/class-detail';
import { cat, loadMessages } from './helpers/i18n';
import { loginAs } from './helpers/roles';
import { watchErrors } from './helpers/ui';

// Spec §2 — the student drill-down. Every rendered value is cross-checked
// against the live C-CLS-06 body for the same student.
const en = loadMessages('en');
const SCREENSHOTS = path.resolve(process.cwd(), '.qa', 'screenshots');

// The spec's fixed tile order.
const SUBSKILLS = ['decoding', 'vocabulary', 'grammar', 'gist', 'detail', 'inference', 'critical'] as const;

test.describe.configure({ mode: 'serial' });

test.describe('student drill-down (spec §2)', () => {
  test('flow 9: clicking a student row opens their drill-down with real identity data', async ({
    page,
  }) => {
    const errors = watchErrors(page);
    await loginAs(page, 'schoolAdmin');
    const jwt = await schoolAdminJwt(page.request);
    const detail = await apiClassDetail(page.request, jwt);
    const target = studentWithEvidence(detail, 'A');
    expect(target, 'no student with scored Test A evidence — run the fixture seed first').toBeTruthy();

    await gotoClassDetail(page);
    await page.getByRole('link', { name: fullName(target!), exact: true }).click();
    await page.waitForURL(/\/classes\/[a-z0-9]+\/students\/[a-z0-9]+$/);

    const student = await apiClassStudent(page.request, jwt, target!.documentId);
    const surface = page.locator('[data-surface="school-admin-class-student-detail"]');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(fullName(student));
    await expect(surface).toContainText(student.class.name ?? '');
    await expect(surface).toContainText(cat(en, 'Classes.studentDetail.firstLanguageLabel'));
    await expect(surface).toContainText(cat(en, 'Classes.studentDetail.levelLabel'));

    // The spec's navigation trail: Classes / <Class Name> / <Student Name>. The
    // class crumb must name the CLASS and link to it — not repeat the student.
    const crumbs = (await page.locator('nav[aria-label] ol li').allInnerTexts())
      .map((crumb) => crumb.trim())
      .filter((crumb) => crumb !== '' && crumb !== '/');
    expect(crumbs.slice(-2)).toEqual([student.class.name, fullName(student)]);
    await expect(
      page.locator('nav[aria-label]').getByRole('link', { name: student.class.name ?? '' }),
    ).toHaveAttribute('href', new RegExp(`/classes/${student.class.documentId}$`));

    expect(errors).toEqual([]);
    await page.screenshot({
      path: path.join(SCREENSHOTS, 'student-drilldown-desktop.png'),
      fullPage: true,
    });
  });

  test('flow 10: a completed test renders score, ACARA and the 7 tiles in spec order', async ({
    page,
  }) => {
    await loginAs(page, 'schoolAdmin');
    const jwt = await schoolAdminJwt(page.request);
    const detail = await apiClassDetail(page.request, jwt);
    const target = studentWithEvidence(detail, 'A');
    const student = await apiClassStudent(page.request, jwt, target!.documentId);
    const testA = student.tests.find((test) => test.test_id === 'A');
    expect(testA?.status).toBe('completed');
    expect(testA?.subskills).not.toBeNull();

    await page.goto(
      `/dashboard/school/classes/${student.class.documentId}/students/${student.documentId}`,
    );
    const card = page.locator('section[aria-labelledby="test-A-heading"]');
    await expect(card).toBeVisible();

    // Header: score out of 100 and the backend's phase label, verbatim.
    await expect(card).toContainText(`${testA!.overall_score} / 100`);
    expect(ACARA_PHASES as readonly string[]).toContain(testA!.acara_phase);
    await expect(card).toContainText(testA!.acara_phase!);

    // The tiles render in the spec's FIXED order, with the API's verdicts.
    const tiles = card.locator('[data-slot="tint-tile"]');
    await expect(tiles).toHaveCount(SUBSKILLS.length);
    const tileText = await tiles.allInnerTexts();
    for (const [index, key] of SUBSKILLS.entries()) {
      const label = cat(en, `Classes.studentDetail.subskill.${key}`);
      const verdict =
        testA!.subskills![key] === 'mastered'
          ? cat(en, 'Classes.studentDetail.mastered')
          : cat(en, 'Classes.studentDetail.notYet');
      expect(tileText[index], `tile ${index} should be ${label}`).toContain(label);
      expect(tileText[index], `${label} verdict`).toContain(verdict);
    }
  });

  test('flow 11: an unstarted test is one muted line, and its row is not clickable', async ({
    page,
  }) => {
    await loginAs(page, 'schoolAdmin');
    const jwt = await schoolAdminJwt(page.request);
    const detail = await apiClassDetail(page.request, jwt);

    // A student with Test A done and Test B not started.
    const target = detail.students.find(
      (student) =>
        student.tests.some((test) => test.test_id === 'A' && test.status === 'completed') &&
        student.tests.some((test) => test.test_id === 'B' && test.status !== 'completed'),
    );
    expect(target, 'need a student with one completed and one uncompleted test').toBeTruthy();

    await page.goto(
      `/dashboard/school/classes/${detail.documentId}/students/${target!.documentId}`,
    );
    await expect(page.locator('section[aria-labelledby="test-B-heading"]')).toHaveCount(0);
    await expect(page.locator('[data-surface="school-admin-class-student-detail"]')).toContainText(
      cat(en, 'Classes.studentDetail.notCompleted').replace('{slot}', 'B'),
    );

    // A completed test the scorer produced NO evidence for renders the card with
    // em dashes and an explicit line instead of seven fabricated grey tiles.
    const evidenceless = detail.students.find((student) =>
      student.tests.some(
        (test) => test.status === 'completed' && test.overall_score === null && test.subskills === null,
      ),
    );
    if (evidenceless) {
      await page.goto(
        `/dashboard/school/classes/${detail.documentId}/students/${evidenceless.documentId}`,
      );
      const card = page.locator('section[aria-labelledby="test-A-heading"]');
      await expect(card).toContainText('—');
      await expect(card).toContainText(cat(en, 'Classes.studentDetail.noSubskills'));
      await expect(card.locator('[data-slot="tint-tile"]')).toHaveCount(0);
    }

    // A row with NEITHER test started is not a link (nothing to drill into).
    const untouched = detail.students.find((student) =>
      student.tests.every((test) => test.status === 'not_started'),
    );
    expect(untouched, 'need a student with no test started').toBeTruthy();
    await gotoClassDetail(page);
    const row = page
      .locator('[data-surface="school-admin-class-detail"] tbody tr')
      .filter({ hasText: fullName(untouched!) })
      .first();
    await expect(row.getByRole('link')).toHaveCount(0);
  });
});
