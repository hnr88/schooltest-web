/**
 * School-admin design-vs-app gap audit — CAPTURE LANE (read-only over seeds).
 *
 * Signs in as the seeded schoolAdmin and captures every screen the persona can
 * reach at 1440x900 into .qa/journeys/school-admin-gap-audit/shots/, recording
 * per-screen console errors and any Next dev-overlay issue badge. The only
 * writes are a self-owned probe class (deleted after) so the destructive
 * confirm dialog can be opened on a row this run owns — seeds are never touched.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { apiClassDetail } from './helpers/class-detail';
import { cat, loadMessages } from './helpers/i18n';
import { loginAs } from './helpers/roles';

const en = loadMessages('en');
const SHOTS = path.resolve(__dirname, '..', '..', '..', '.qa', 'journeys', 'school-admin-gap-audit', 'shots');
const VIEWPORT = { width: 1440, height: 900 };
const API = process.env.E2E_API_BASE_URL ?? 'http://127.0.0.1:5500';

type ConsoleReport = Record<string, string[]>;
const consoleReport: ConsoleReport = {};
const overlayReport: Record<string, string> = {};

/** Capture one screen: viewport shot + console errors + dev-overlay badge text. */
async function capture(page: Page, name: string, ready: Promise<unknown>): Promise<void> {
  const errors: string[] = [];
  const listener = (message: { type(): string; text(): string }): void => {
    if (message.type() === 'error') errors.push(message.text().slice(0, 300));
  };
  page.on('console', listener);
  page.on('pageerror', (error) => errors.push(`pageerror: ${String(error).slice(0, 300)}`));
  await ready;
  await page.waitForTimeout(400);
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`) });
  const overlay = await page
    .locator('[data-nextjs-dev-tools-button], nextjs-portal')
    .first()
    .textContent({ timeout: 1_000 })
    .catch(() => null);
  consoleReport[name] = errors;
  if (overlay && overlay.trim()) overlayReport[name] = overlay.trim().slice(0, 80);
  page.off('console', listener);
}

async function jwtOf(page: Page): Promise<string> {
  const token = await page.evaluate(() => window.localStorage.getItem('app.auth.token'));
  if (!token) throw new Error('no schoolAdmin JWT in localStorage');
  return token;
}

test('capture every school-admin screen for the design-vs-app audit', async ({ page }, testInfo) => {
  test.setTimeout(300_000);
  await page.setViewportSize(VIEWPORT);
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  await loginAs(page, 'schoolAdmin');
  const jwt = await jwtOf(page);
  const auth = { headers: { Authorization: `Bearer ${jwt}` } };

  const classesRes = await page.request.get(`${API}/api/schools/me/classes`, auth);
  const classes = (await classesRes.json()) as { data: { documentId: string; name: string }[] };
  const classId = classes.data[0]?.documentId ?? '';
  expect(classId, 'the seeded school has at least one class').toBeTruthy();
  const detail = await apiClassDetail(page.request, jwt, classId);
  const studentId = detail.students[0]?.documentId ?? '';
  const teachersRes = await page.request.get(`${API}/api/schools/me/teachers`, auth);
  const teachers = (await teachersRes.json()) as { data: { documentId: string }[] };
  const teacherId = teachers.data[0]?.documentId ?? '';
  const studentsRes = await page.request.get(`${API}/api/schools/me/children`, auth);
  const students = (await studentsRes.json()) as { data: { documentId: string }[] };
  const anyStudentId = studentId || students.data[0]?.documentId || '';

  const goto = (route: string): Promise<unknown> =>
    page.goto(route).then((r) => expect(r?.status(), route).toBeLessThan(400));

  // --- the screens the design draws (S03-S10) ---
  await capture(page, '01-school-home', goto('/dashboard/school'));
  await capture(page, '02-classes-list', goto('/dashboard/school/classes'));
  if (classId) await capture(page, '03-class-detail', goto(`/dashboard/school/classes/${classId}`));
  if (classId && anyStudentId) {
    await capture(
      page,
      '04-class-scoped-student',
      goto(`/dashboard/school/classes/${classId}/students/${anyStudentId}`),
    );
  }
  await capture(page, '05-students-list', goto('/dashboard/school/students'));
  if (anyStudentId) await capture(page, '06-student-detail', goto(`/dashboard/school/students/${anyStudentId}`));
  await capture(page, '07-students-new-page', goto('/dashboard/school/students/new'));
  await capture(page, '08-teachers-list', goto('/dashboard/school/teachers'));
  if (teacherId) await capture(page, '09-teacher-detail', goto(`/dashboard/school/teachers/${teacherId}`));
  await capture(page, '10-account', goto('/dashboard/school/account'));

  // --- routes the design does NOT draw (presence = a gap of the opposite kind) ---
  await capture(page, '11-analytics-undrawn', goto('/dashboard/school/analytics'));
  await capture(page, '12-participation-undrawn', goto('/dashboard/school/participation'));
  await capture(page, '13-children-legacy', goto('/dashboard/school/children'));

  // --- the overlays the design draws (S11-S18, S01a, S01b, S17) ---
  await page.goto('/dashboard/school/classes');
  await page
    .getByRole('button', { name: cat(en, 'Classes.addButton') })
    .first()
    .click({ timeout: 15_000 });
  await capture(page, '14-dialog-add-class', expect(page.getByRole('dialog')).toBeVisible());
  await page.keyboard.press('Escape');

  await page.goto('/dashboard/school/teachers');
  await page
    .getByRole('button', { name: /add teacher/i })
    .first()
    .click({ timeout: 15_000 });
  await capture(page, '15-dialog-add-teacher', expect(page.getByRole('dialog')).toBeVisible());
  await page.keyboard.press('Escape');

  if (classId) {
    await page.goto(`/dashboard/school/classes/${classId}`);
    await page
      .getByRole('button', { name: cat(en, 'Classes.detail.importStudents') })
      .first()
      .click({ timeout: 15_000 });
    await capture(page, '16-dialog-import', expect(page.getByRole('dialog')).toBeVisible());
    await page.keyboard.press('Escape');
  }

  // The user menu and school switcher on the rail (S01a/S01b).
  await page.goto('/dashboard/school');
  const menuTrigger = page
    .locator('aside button, [data-slot="sidebar"] button')
    .filter({ hasText: /admin/i })
    .first();
  await menuTrigger.click({ timeout: 10_000 }).catch(() => null);
  await capture(page, '17-user-menu', expect(page.getByRole('menu')).toBeVisible());
  await page.keyboard.press('Escape');
  const switcher = page.locator('aside [role="combobox"], aside [data-slot="select-trigger"]').first();
  await switcher.click({ timeout: 10_000 }).catch(() => null);
  await capture(page, '18-school-switcher', page.waitForTimeout(500));

  writeFileSync(path.join(SHOTS, '..', 'console-report.json'), JSON.stringify({ consoleReport, overlayReport }, null, 2));
  await testInfo.attach('console-report.json', {
    body: JSON.stringify({ consoleReport, overlayReport }, null, 2),
    contentType: 'application/json',
  });
});
