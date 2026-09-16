import { expect, test, type Page } from '@playwright/test';

import { bearerFor, drain, observe, readTeacherClasses, shot, signInTeacherEmail } from './helpers/fleet8';

// F8 sweep 2/5 — Class -> Students roster and the student drill-down on t2's
// richest class (Reading 8B), plus the Progress tab. Everything is read live:
// the roster the page shows is compared against GET /api/teacher/classes/:id/students'
// row count served to the SAME class. Focus findings: blank status pills
// (the students table's status field was renamed student_status server-side),
// progress/attribute bars for students with results, and a console sweep.
test.describe.configure({ mode: 'serial' });
test.setTimeout(90_000);
test.use({ viewport: { width: 1440, height: 900 } });

let page: Page;
let classId = '';
let studentId = '';
let studentName = '';

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
});

test.afterAll(async () => {
  await page?.close();
});

test('roster loads on the richest t2 class and matches the served row count', async ({ request }) => {
  const traffic = observe(page);
  await signInTeacherEmail(page, 't2@schooltest.local');
  const jwt = await bearerFor(request, 't2@schooltest.local');
  const classes = await readTeacherClasses(request, jwt);
  test.skip(classes.length === 0, 't2 owns no class');
  const richest = classes.reduce((a, b) => (b.student_count > a.student_count ? b : a));
  classId = richest.class_document_id;

  await page.goto(`/dashboard/results/${classId}`);
  await expect(page.locator('[data-surface="teacher-class-results"]')).toHaveAttribute('data-status', 'ready', {
    timeout: 60_000,
  });
  // The Students tab is the default section; open it explicitly either way.
  await page.getByRole('tab', { name: /^Students/ }).click();
  const rows = page.locator('[data-slot="student-results-row"]');
  await expect(rows.first()).toBeVisible({ timeout: 30_000 });
  await expect(rows).toHaveCount(richest.student_count);
  await shot(page, '20-roster-students-tab');

  // Every row: a real name, and a score cell that is never silently blank.
  const names = await rows.locator('[data-slot="student-name"]').allInnerTexts();
  expect(names.every((name) => name.trim().length > 0), 'every roster row shows a name').toBe(true);
  const scores = await rows.locator('[data-slot="student-score"]').allInnerTexts();
  expect(scores).toHaveLength(richest.student_count);
  console.log(
    `[fleet8] roster ${richest.name}: ${rows.length} rows; first 5 scores: ${scores.slice(0, 5).join(', ')}`,
  );

  // Census of status pills inside the roster rows (the renamed-field probe):
  // a pill that renders EMPTY text on every row is the reported defect.
  const pillTexts = await rows
    .locator('[data-slot="status-pill"], [data-slot="student-status"]')
    .allInnerTexts();
  console.log(`[fleet8] roster status-pill census (${pillTexts.length}): ${pillTexts.slice(0, 8).join(' | ')}`);
  if (pillTexts.length > 0) {
    expect(
      pillTexts.some((text) => text.trim().length > 0),
      '[BUG CHECK] roster status pills must not all be blank',
    ).toBe(true);
  }

  expect(drain(traffic), 'errors on the roster').toEqual([]);
});

test('student detail opens from a scored row; every rendered status pill carries text', async () => {
  const traffic = observe(page);
  const scored = page.locator('[data-slot="student-results-row"][data-scored="true"]');
  test.skip((await scored.count()) === 0, 'no scored student on this class yet');
  await scored.first().getByRole('link', { name: /.*/ }).first().click();
  await page.waitForURL(/\/dashboard\/results\/[^/]+\/students\/[^/]+/);
  studentId = page.url().split('/').pop() ?? '';

  const surface = page.locator('[data-surface]');
  await expect(surface.last()).toBeVisible({ timeout: 60_000 });
  await page.waitForLoadState('networkidle').catch(() => {});
  await shot(page, '21-student-detail-top');

  // The header must name the student (not a crash card).
  const heading = page.getByRole('heading').first();
  studentName = (await heading.innerText()).trim();
  expect(studentName.length, 'student detail header has a name').toBeGreaterThan(0);

  // THE status-pill census: a blank pill anywhere is the reported defect — the
  // server renamed students.status to student_status and a pill reading the old
  // key renders empty. Collect every pill on the surface and demand text.
  const pills = page.locator('[data-slot="status-pill"]');
  const count = await pills.count();
  const texts: string[] = [];
  for (let index = 0; index < count; index += 1) {
    texts.push((await pills.nth(index).innerText()).trim());
  }
  console.log(`[fleet8] student-detail pill census (${count}): ${texts.join(' | ') || '(none)'}`);
  const blanks = texts.filter((text) => text.length === 0);
  expect(blanks, `[BUG] ${blanks.length} blank status pill(s) on the student detail`).toEqual([]);

  // Attribute/skill cards with progress bars: a scored student shows bar tracks.
  const tracks = page.locator('[data-slot="report-attribute-track"], [class*="scaleX"], [data-slot*="track"]');
  console.log(`[fleet8] student-detail bar-track census: ${await tracks.count()}`);
  await page.mouse.wheel(0, 900);
  await page.waitForTimeout(400);
  await shot(page, '22-student-detail-progress');

  expect(drain(traffic), 'errors on the student detail').toEqual([]);
});

test('class Progress tab renders its chart and lists for a class with results', async () => {
  const traffic = observe(page);
  await page.goto(`/dashboard/results/${classId}?tab=progress`);
  const progress = page.locator('[data-slot="class-progress"]');
  await expect(progress).toBeVisible({ timeout: 60_000 });
  await shot(page, '23-class-progress-tab');

  const text = (await progress.innerText()).trim();
  expect(text.length, 'progress panel is not empty').toBeGreaterThan(40);
  // Some bar geometry must exist (chart bars or delta pills) — nothing solid means
  // the panel is a shell.
  const bars = await progress.locator('[style*="scaleX"], [style*="width"], svg rect, svg path').count();
  console.log(`[fleet8] progress bar-ish nodes: ${bars}`);
  expect(bars, 'progress tab draws at least one bar/arc').toBeGreaterThan(0);

  expect(drain(traffic), 'errors on the Progress tab').toEqual([]);
});

test('bogus student documentId in the drill-down URL is refused, never a crash', async () => {
  const traffic = observe(page);
  await page.goto(`/dashboard/results/${classId}/students/zzbogusstudentid00`);
  await page.waitForLoadState('networkidle').catch(() => {});
  await shot(page, '24-student-detail-bogus-id');
  const body = (await page.locator('body').innerText()).slice(0, 400);
  console.log(`[fleet8] bogus student id body: ${body.replace(/\n/g, ' ').slice(0, 220)}`);
  expect(page.getByText(/application error/i)).toHaveCount(0);
  // The refused drill-down must NOT render a real student's identity.
  expect(page.locator('[data-slot="student-name"]')).toHaveCount(0);
  expect(drain(traffic).filter((entry) => !entry.includes('404')).length, 'non-404 errors on bogus id').toEqual(0);
});
