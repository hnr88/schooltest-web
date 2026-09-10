import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { cat } from './helpers/i18n';
import { en, SCREENSHOTS } from './helpers/teacher-rail';
import {
  backToResultsList,
  headerStat,
  openFirstClass,
  openResultsList,
  readLiveResults,
  resultsRows,
  signedInTeacherPage,
  TEACHER_EMAIL,
  type LiveResults,
} from './helpers/teacher-results-live';

// Task 040 — the Results class list and the class-detail summary header, proven
// against the RUNNING app on :3000 and the REAL Strapi. Every expected number is
// read live from C-TD-1 / C-TR-1 in beforeAll and compared to the rendered DOM;
// nothing in this file is a fixture, and no threshold is computed here.
// The class-results tab frame is proven by teacher-results-tabs.spec.ts (task 07
// widens it to six and may not edit this file).

// ONE sign-in for the whole file (see signedInTeacherPage): the API's auth guard
// rate-limits POST /api/auth/local per IP, so a per-test login is flaky by
// construction. Serial mode is the price of the shared session.
test.describe.configure({ mode: 'serial' });

let live: LiveResults;

/**
 * ops/34 (orchestrator-authorised foreign fix) — the harness's `detail` went
 * opt-in when the C-TR-1 route retired (410 Gone), so every use site narrows
 * through this guard instead of a non-null assertion: a missing detail is a
 * stated precondition failure, never a silent `undefined` walk.
 */
function requireDetail(): NonNullable<LiveResults['detail']> {
  if (!live.detail) throw new Error('[e2e] live C-TR-1 detail unavailable — the route retired; re-point this spec');
  return live.detail;
}

let page: Page;

test.beforeAll(async ({ browser, playwright }) => {
  live = await readLiveResults(playwright, TEACHER_EMAIL, { withDetail: false });
  page = await signedInTeacherPage(browser);
  await openResultsList(page);
});

test.afterAll(async () => {
  if (page) await page.close();
});

test.describe('Results class list (C-TD-1)', () => {
  test('lists every class the teacher owns with its real roster and completion', async () => {
    await backToResultsList(page);

    await expect(resultsRows(page)).toHaveCount(live.classes.length);
    for (const owned of live.classes) {
      const row = page.locator(`[data-class-id="${owned.class_document_id}"]`);
      await expect(row).toContainText(owned.name);
      await expect(row).toContainText(`${owned.student_count}`);
      await expect(row).toContainText(`${owned.test_a.completed} / ${owned.test_a.total}`);
      await expect(row).toContainText(`${owned.test_b.completed} / ${owned.test_b.total}`);
      // A real link, so it is keyboard-reachable, and >= 44px on the pointer axis.
      await expect(row).toHaveJSProperty('tagName', 'A');
      const box = await row.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    }

    await page.screenshot({
      path: path.join(SCREENSHOTS, 'task-040-results-class-list.png'),
      animations: 'disabled',
      fullPage: true,
    });
  });

  test('every row navigates to that class, and the crumb names it', async () => {
    await backToResultsList(page);
    await openFirstClass(page, live);
    const first = live.classes[0];

    await expect(page).toHaveURL(new RegExp(`/dashboard/results/${first.class_document_id}$`));
    // The app has exactly ONE breadcrumb (the shell topbar); the class name reaches
    // it through the shell's public useRecordCrumb, so no second trail is rendered.
    await expect(page.locator('[data-slot="breadcrumb"]')).toContainText(first.name);
  });
});

// teacher/06 — C-TR-1 answers 410 Gone (retired by scoring task 24) and the
// class-detail surface is teacher/07's in-flight rebuild, so these header
// assertions SKIP with that reason until the replacement read lands. The LIST
// half of this file (C-TD-1) is unaffected and still proven above.
test.describe('Results class detail header (C-TR-1 summary)', () => {

  test('prints the server summary verbatim: roster, A/B completed, avg score, top gap', async () => {
    test.skip(!live?.detail, 'C-TR-1 is 410 Gone (scoring task 24); detail harness returns with task 07');
    await backToResultsList(page);
    await openFirstClass(page, live);
    const { class: klass, summary } = requireDetail();

    await expect(page.getByRole('heading', { level: 1, name: klass.name })).toBeVisible();
    await expect(page.locator('[data-slot="class-results-header"]')).toContainText(
      `${klass.student_count}`,
    );

    await expect(headerStat(page, 'test-a')).toContainText(
      `${summary.test_a.completed} / ${summary.test_a.total}`,
    );
    await expect(headerStat(page, 'test-b')).toContainText(
      `${summary.test_b.completed} / ${summary.test_b.total}`,
    );

    // avg_score / top_gap are `number | null` and `object | null` on the wire. Each
    // branch is asserted for what the server actually sent — a null renders an
    // explicit absence with its reason, never a 0 and never an invented subskill.
    if (summary.avg_score === null) {
      await expect(headerStat(page, 'avg-score')).toContainText(
        cat(en, 'Teacher.results.detail.avgScoreNone'),
      );
      await expect(headerStat(page, 'avg-score')).not.toContainText(/\d/);
    } else {
      await expect(headerStat(page, 'avg-score')).toContainText(`${summary.avg_score} / 100`);
    }

    if (summary.top_gap === null) {
      await expect(headerStat(page, 'top-gap')).toContainText(
        cat(en, 'Teacher.results.detail.topGapNone'),
      );
    } else {
      await expect(headerStat(page, 'top-gap')).toContainText(summary.top_gap.name);
      // The band is spelled out in WORDS beside the count — never colour alone.
      await expect(headerStat(page, 'top-gap')).toContainText(
        `${summary.top_gap.not_yet_count} not yet mastered`,
      );
      // …and that pill stays on ONE line, so its tint cannot break across rows.
      const pill = headerStat(page, 'top-gap').locator('[data-slot="status-pill"]');
      const box = await pill.boundingBox();
      expect(box?.height ?? 0).toBeLessThan(32);
    }

    // The ONE RULE: the header prints the server's numbers and re-thresholds none
    // of them. `/100` is a denominator, never a mastery cut.
    await expect(page.locator('[data-slot="class-results-header"]')).not.toContainText(
      /\b(80|50)%/,
    );

    await page.screenshot({
      path: path.join(SCREENSHOTS, 'task-040-class-detail-students-tab.png'),
      animations: 'disabled',
      fullPage: true,
    });
  });

  test('one h1, and the summary is a named region wrapping a real description list', async () => {
    test.skip(!live?.detail, 'C-TR-1 is 410 Gone (scoring task 24); detail harness returns with task 07');
    await backToResultsList(page);
    await openFirstClass(page, live);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    const region = page.getByRole('region', {
      name: cat(en, 'Teacher.results.detail.summaryLabel'),
    });
    await expect(region).toBeVisible();
    await expect(region.locator('dl')).toHaveCount(1);
    await expect(region.locator('dt')).toHaveCount(4);
    await expect(region.locator('dd')).toHaveCount(4);
  });
});
