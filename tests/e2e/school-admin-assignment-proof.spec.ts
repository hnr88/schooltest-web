import path from 'node:path';

import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { roleCredentials } from './helpers/credentials';
import { cat, icu, loadMessages } from './helpers/i18n';

// Operator-requested proof for the school-admin design fixes and the missing
// assignment features (navy buttons, select highlight contrast, dialog widths,
// teacher/class and student/class assignment both ways). Drives the REAL UI as
// the seeded school_admin, cross-checks every write against the live API and
// restores the seeded state before leaving. Fixtures are picked from the LIVE
// database (the named seed personas of older specs are long gone): any class
// with a teacher is the fixture, a teacher outside it is the probe, and a
// student outside it is the moved child.
const en = loadMessages('en');

const API = 'http://127.0.0.1:5500';
const ADMIN = roleCredentials('schoolAdmin');
const SHOTS = path.resolve(process.cwd(), '.qa', 'screenshots', 'school-admin-proof');

// The design's navy #0E2350 (--navy-900). Chromium reports OKLCH-token colors
// from getComputedStyle in lab(), so the assertion pins that exact computed
// form; the old wrong color (blue-600 #2563EB) has lab L≈55 vs this L≈14.
const NAVY_LAB = 'lab(14.3382 6.30024 -30.6936)';

interface SchoolClassRow {
  documentId: string;
  name: string;
  teachers: Array<{ documentId: string }>;
  student_count: number;
}
interface TeacherRow {
  documentId: string;
  first_name: string | null;
  last_name: string | null;
  blocked?: boolean;
}
interface ChildRow {
  documentId: string;
  given_name: string;
  family_name: string;
  class: { documentId: string } | null;
}

async function fetchWithRetry<
  T extends { status: () => number; headers: () => Record<string, string> },
>(call: () => Promise<T>): Promise<T> {
  let last: T | undefined;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const res = await call();
    if (res.status() !== 429) return res;
    last = res;
    const retryAfter = Number(res.headers()['retry-after'] ?? '3');
    await new Promise((resolve) => setTimeout(resolve, Math.min(retryAfter, 65) * 1000 + 250));
  }
  return last as T;
}

async function apiLogin(request: APIRequestContext): Promise<string> {
  const res = await fetchWithRetry(() =>
    request.post(`${API}/api/auth/local`, {
      data: { identifier: ADMIN.email, password: ADMIN.password },
    }),
  );
  expect(res.ok()).toBeTruthy();
  return ((await res.json()) as { jwt: string }).jwt;
}

async function apiGet<T>(request: APIRequestContext, jwt: string, path: string): Promise<T> {
  const res = await fetchWithRetry(() =>
    request.get(`${API}${path}`, { headers: { Authorization: `Bearer ${jwt}` } }),
  );
  expect(res.ok()).toBeTruthy();
  return ((await res.json()) as { data: T }).data;
}


function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function nameStartsWith(value: string): RegExp {
  return new RegExp(`^${escapeRegExp(value)}`);
}


async function waitForApiBudget(request: APIRequestContext): Promise<void> {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const probe = await request.get(`${API}/api/schools/me/classes`);
    if (probe.status() !== 429) return;
    await new Promise((resolve) => setTimeout(resolve, 5_000));
  }
}

async function signIn(page: Page): Promise<void> {
  await page.goto('/sign-in');
  await page
    .getByLabel(cat(en, 'Auth.portal.emailLabel'), { exact: true })
    .fill(ADMIN.email);
  await page
    .getByLabel(cat(en, 'Auth.portal.passwordLabel'), { exact: true })
    .fill(ADMIN.password);
  await page
    .getByRole('button', { name: cat(en, 'Auth.portal.loginButton'), exact: true })
    .click();
  await page.waitForURL('**/dashboard', { timeout: 60_000 });
}

function teacherName(row: TeacherRow): string {
  return `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim();
}

function childName(row: ChildRow): string {
  return `${row.given_name} ${row.family_name}`.trim();
}

test.describe('school-admin assignment + design proof', () => {
  test.describe.configure({ mode: 'serial' });

  test('navy buttons, wide dialogs, select contrast, and class/teacher/student assignment both ways', async ({
    page,
    request,
  }, testInfo) => {
    testInfo.setTimeout(600_000);
    // The API is shared: wait out any 429 window before driving the UI, so the
    // page's own queries never start against a saturated limiter.
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const probe = await request.get(`${API}/api/schools/me/classes`);
      if (probe.status() !== 429) break;
      await new Promise((resolve) => setTimeout(resolve, 5_000));
    }
    const jwt = await apiLogin(request);
    const classes = await apiGet<SchoolClassRow[]>(request, jwt, '/api/schools/me/classes');
    const teachers = await apiGet<TeacherRow[]>(request, jwt, '/api/schools/me/teachers');
    const children = await apiGet<ChildRow[]>(
      request,
      jwt,
      '/api/schools/me/children?pageSize=100',
    );

    const fixture = classes.find((row) => row.teachers.length > 0 && row.name);
    expect(fixture).toBeDefined();
    const fixtureName = fixture?.name ?? '';
    const keptId = fixture?.teachers[0]?.documentId ?? '';
    const kept = teachers.find((row) => row.documentId === keptId);
    const probe = teachers.find(
      (row) => row.documentId !== keptId && teacherName(row) !== '' && !row.blocked,
    );
    const child =
      children.find((row) => row.class?.documentId !== fixture?.documentId) ??
      children.find((row) => row.documentId);
    expect(kept).toBeDefined();
    expect(probe).toBeDefined();
    expect(child).toBeDefined();
    const classDetailData = await apiGet<{ teacher: { first_name: string | null; last_name: string | null } | null }>(
      request,
      jwt,
      `/api/schools/me/classes/${fixture?.documentId ?? ''}`,
    );
    const detailTeacher = classDetailData.teacher;
    const detailTeacherName = detailTeacher
      ? [detailTeacher.first_name, detailTeacher.last_name].filter(Boolean).join(' ').trim()
      : '';
    const keptName = teacherName(kept as TeacherRow);
    const probeName = teacherName(probe as TeacherRow);
    const childLabel = childName(child as ChildRow);
    // The child's REAL seeded class (never null blindly — restore what was there).
    const childOriginalClassId = child?.class?.documentId ?? null;

    // Normalize leftovers from any earlier interrupted run so every UI action
    // below changes something: probe out of the fixture, child back home.
    const normalizeTeachers = (fixture as SchoolClassRow).teachers
      .map((entry) => entry.documentId)
      .filter((id) => id !== probe?.documentId);
    {
      const res = await fetchWithRetry(() =>
        request.patch(`${API}/api/schools/me/classes/${fixture?.documentId ?? ''}`, {
          headers: { Authorization: `Bearer ${jwt}` },
          data: { teacher_documentIds: normalizeTeachers },
        }),
      );
      expect(res.ok()).toBeTruthy();
    }
    if ((child?.class?.documentId ?? null) !== null || childOriginalClassId === null) {
      // only needed when the child is not already in their recorded class
      const res = await fetchWithRetry(() =>
        request.patch(`${API}/api/schools/me/children/${child?.documentId ?? ''}`, {
          headers: { Authorization: `Bearer ${jwt}` },
          data: { class_documentId: childOriginalClassId },
        }),
      );
      expect(res.ok()).toBeTruthy();
    }

    await signIn(page);

    // ---- 1. TEACHER DETAIL: navy primary button + assign dialog at 520px ----
    await page.goto(`/en/dashboard/school/teachers/${probe?.documentId ?? ''}`);
    const teacherScreen = page.locator('[data-slot="school-teacher-detail"]');
    await expect(teacherScreen).toBeVisible({ timeout: 20_000 });
    const assignButton = teacherScreen.getByRole('button', {
      name: cat(en, 'Teachers.detail.assignButton'),
      exact: true,
    });
    await expect(assignButton).toBeVisible();
    await expect(assignButton).toHaveCSS('background-color', NAVY_LAB);
    await page.screenshot({ path: path.join(SHOTS, 'teacher-detail.png'), fullPage: true });

    await assignButton.click();
    const assignDialog = page.locator('[data-slot="ops-dialog-content"]');
    await expect(
      assignDialog.getByText(cat(en, 'Teachers.detail.assignDialog.title')),
    ).toBeVisible();
    await page.waitForTimeout(400);
    const assignBox = await assignDialog.boundingBox();
    expect(assignBox?.width ?? 0).toBeGreaterThanOrEqual(519);
    await page.screenshot({ path: path.join(SHOTS, 'teacher-assign-dialog.png') });

    await assignDialog.getByRole('checkbox', { name: nameStartsWith(fixtureName) }).check();
    await assignDialog
      .getByRole('button', { name: cat(en, 'Teachers.detail.assignDialog.submit'), exact: true })
      .click();
    await expect(assignDialog).toBeHidden({ timeout: 20_000 });
    let classesNow = await apiGet<SchoolClassRow[]>(request, jwt, '/api/schools/me/classes');
    expect(
      classesNow
        .find((row) => row.documentId === fixture?.documentId)
        ?.teachers.map((entry) => entry.documentId),
    ).toContain(probe?.documentId);

    const removeOnTeacher = teacherScreen.getByRole('button', {
      name: icu(cat(en, 'Teachers.detail.classesPanel.removeLabel'), { name: fixtureName }),
      exact: true,
    });
    await expect(removeOnTeacher).toBeVisible();
    await removeOnTeacher.click();
    await expect(removeOnTeacher).toBeHidden({ timeout: 20_000 });
    classesNow = await apiGet<SchoolClassRow[]>(request, jwt, '/api/schools/me/classes');
    expect(
      classesNow
        .find((row) => row.documentId === fixture?.documentId)
        ?.teachers.map((entry) => entry.documentId),
    ).not.toContain(probe?.documentId);

    // ---- 2. STUDENT DETAIL: edit dialog at 560px + class assign/remove ----
    await page.goto(`/en/dashboard/school/students/${child?.documentId ?? ''}`);
    const studentScreen = page.locator('[data-slot="school-student-detail"]');
    await expect(studentScreen).toBeVisible({ timeout: 20_000 });
    const classPanel = studentScreen.locator('[data-slot="student-class-panel"]');
    await expect(classPanel).toBeVisible();
    await page.screenshot({ path: path.join(SHOTS, 'student-detail.png'), fullPage: true });

    const editButton = studentScreen.getByRole('button', {
      name: cat(en, 'SchoolStudents.detail.editButton'),
      exact: true,
    });
    await editButton.click();
    const editDialog = page.locator('[data-slot="ops-dialog-content"]');
    await expect(editDialog).toBeVisible();
    await page.waitForTimeout(400);
    const editBox = await editDialog.boundingBox();
    expect(editBox?.width ?? 0).toBeGreaterThanOrEqual(559);
    await page.screenshot({ path: path.join(SHOTS, 'student-edit-dialog.png') });
    await page.keyboard.press('Escape');
    await expect(editDialog).toBeHidden();

    const assignSelect = classPanel.locator('#student-class-assign');
    const assignAction = classPanel.getByRole('button', {
      name: cat(en, 'SchoolStudents.detail.classPanel.assignAction'),
      exact: true,
    });
    const removeAction = classPanel.getByRole('button', {
      name: cat(en, 'SchoolStudents.detail.classPanel.removeAction'),
      exact: true,
    });
    const currentLabel = classPanel.locator('[data-slot="student-class-current"]');

    await assignSelect.selectOption(fixture?.documentId ?? '');
    await assignAction.click();
    await expect(currentLabel).toContainText(fixtureName, { timeout: 20_000 });
    let childrenNow = await apiGet<ChildRow[]>(
      request,
      jwt,
      '/api/schools/me/children?pageSize=100',
    );
    expect(
      childrenNow.find((row) => row.documentId === child?.documentId)?.class?.documentId,
    ).toBe(fixture?.documentId);

    await removeAction.click();
    await expect(currentLabel).toContainText(cat(en, 'SchoolStudents.detail.classPanel.none'), {
      timeout: 20_000,
    });
    childrenNow = await apiGet<ChildRow[]>(
      request,
      jwt,
      '/api/schools/me/children?pageSize=100',
    );
    expect(childrenNow.find((row) => row.documentId === child?.documentId)?.class).toBeNull();

    // ---- 3. CLASS DETAIL: teacher chips + pickers, roster add/remove ----
    await page.goto(`/en/dashboard/school/classes/${fixture?.documentId ?? ''}`);
    const classScreen = page.locator('[data-slot="school-class-detail"]');
    await expect(classScreen).toBeVisible({ timeout: 20_000 });
    // The chip shows the class detail's served teacher; with the current DB's
    // nameless teacher accounts the panel honestly reads "Unassigned" instead.
    const teacherUnassignedText = cat(en, 'Classes.detail.teacherUnassigned');
    if (detailTeacherName) {
      await expect(
        classScreen
          .locator('[data-slot="class-teacher-chip"]')
          .filter({ hasText: detailTeacherName }),
      ).toBeVisible({ timeout: 10_000 });
    } else {
      await expect(classScreen.getByText(teacherUnassignedText, { exact: true })).toBeVisible();
    }
    await page.screenshot({ path: path.join(SHOTS, 'class-detail.png'), fullPage: true });

    await classScreen
      .getByRole('button', { name: cat(en, 'Classes.detail.teachers.add'), exact: true })
      .click();
    const teacherPicker = page.locator('[data-slot="ops-dialog-content"]');
    await expect(
      teacherPicker.getByText(cat(en, 'Classes.detail.teachers.pickerTitle')),
    ).toBeVisible();
    await page.waitForTimeout(400);
    const pickerBox = await teacherPicker.boundingBox();
    expect(pickerBox?.width ?? 0).toBeGreaterThanOrEqual(519);
    await teacherPicker.getByRole('checkbox', { name: nameStartsWith(probeName) }).check();
    await teacherPicker
      .getByRole('button', { name: cat(en, 'Classes.detail.teachers.save'), exact: true })
      .click();
    await expect(teacherPicker).toBeHidden({ timeout: 20_000 });
    classesNow = await apiGet<SchoolClassRow[]>(request, jwt, '/api/schools/me/classes');
    expect(
      classesNow
        .find((row) => row.documentId === fixture?.documentId)
        ?.teachers.map((entry) => entry.documentId),
    ).toContain(probe?.documentId);

    if (detailTeacherName) {
      // Chip X leg: remove the named served teacher through the UI, then
      // restore the seeded list via the API.
      await classScreen
        .locator('[data-slot="class-teacher-chip"]')
        .filter({ hasText: detailTeacherName })
        .getByRole('button', {
          name: icu(cat(en, 'Classes.detail.teachers.removeAria'), { name: detailTeacherName }),
          exact: true,
        })
        .click();
      await expect(
        classScreen.locator('[data-slot="class-teacher-chip"]').filter({ hasText: detailTeacherName }),
      ).toBeHidden({ timeout: 20_000 });
    }
    {
      const res = await fetchWithRetry(() =>
        request.patch(`${API}/api/schools/me/classes/${fixture?.documentId ?? ''}`, {
          headers: { Authorization: `Bearer ${jwt}` },
          data: { teacher_documentIds: normalizeTeachers },
        }),
      );
      expect(res.ok()).toBeTruthy();
    }
    classesNow = await apiGet<SchoolClassRow[]>(request, jwt, '/api/schools/me/classes');
    expect(
      classesNow
        .find((row) => row.documentId === fixture?.documentId)
        ?.teachers.map((entry) => entry.documentId),
    ).not.toContain(probe?.documentId);

    await waitForApiBudget(request);
    await page.reload();
    await expect(classScreen).toBeVisible({ timeout: 30_000 });
    await expect(classScreen.getByText(teacherUnassignedText, { exact: true }).or(classScreen.locator('[data-slot="class-teacher-chip"]').first())).toBeVisible({ timeout: 20_000 });
    await classScreen
      .getByRole('button', { name: cat(en, 'Classes.detail.addStudent'), exact: true })
      .click();
    const studentPicker = page.locator('[data-slot="ops-dialog-content"]');
    await expect(
      studentPicker.getByText(cat(en, 'Classes.detail.studentPicker.title')),
    ).toBeVisible();
    await expect(
      studentPicker.locator('[data-slot="class-students-move-warning"]'),
    ).toBeVisible();
    await studentPicker
      .getByPlaceholder(cat(en, 'Classes.detail.studentPicker.searchPlaceholder'))
      .fill(childLabel);
    const childCheckbox = studentPicker.getByRole('checkbox', {
      name: nameStartsWith(childLabel),
    });
    await expect(childCheckbox).toBeVisible();
    await childCheckbox.check();
    await studentPicker
      .getByRole('button', { name: cat(en, 'Classes.detail.studentPicker.save'), exact: true })
      .click();
    await expect(studentPicker).toBeHidden({ timeout: 20_000 });
    childrenNow = await apiGet<ChildRow[]>(
      request,
      jwt,
      '/api/schools/me/children?pageSize=100',
    );
    expect(
      childrenNow.find((row) => row.documentId === child?.documentId)?.class?.documentId,
    ).toBe(fixture?.documentId);

    await classScreen
      .getByRole('button', {
        name: icu(cat(en, 'Classes.detail.roster.removeStudentAria'), { name: childLabel }),
        exact: true,
      })
      .first()
      .click();
    await page.waitForTimeout(1_500);
    childrenNow = await apiGet<ChildRow[]>(
      request,
      jwt,
      '/api/schools/me/children?pageSize=100',
    );
    expect(childrenNow.find((row) => row.documentId === child?.documentId)?.class).toBeNull();

    // ---- 4. SELECT contrast: the highlighted item must not be white-on-white ----
    await waitForApiBudget(request);
    const sortTrigger = classScreen.locator('[data-slot="select-trigger"]').first();
    await expect(sortTrigger).toBeVisible();
    await sortTrigger.click();
    const highlighted = page.locator('[data-slot="select-item"][data-highlighted]').first();
    await expect(highlighted).toBeVisible();
    const styles = await highlighted.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { bg: cs.backgroundColor, color: cs.color };
    });
    expect(styles.bg).not.toMatch(/rgba?\(255,\s*255,\s*255/);
    expect(styles.bg).not.toBe('transparent');
    await page.screenshot({ path: path.join(SHOTS, 'select-highlight.png') });
    await page.keyboard.press('Escape');

    // Final API guard: the fixture teachers and the probe child are back to
    // their seeded state.
    classesNow = await apiGet<SchoolClassRow[]>(request, jwt, '/api/schools/me/classes');
    expect(
      classesNow
        .find((row) => row.documentId === fixture?.documentId)
        ?.teachers.map((entry) => entry.documentId),
    ).toEqual(normalizeTeachers);
    childrenNow = await apiGet<ChildRow[]>(
      request,
      jwt,
      '/api/schools/me/children?pageSize=100',
    );
    expect(
      childrenNow.find((row) => row.documentId === child?.documentId)?.class?.documentId ?? null,
    ).toBe(childOriginalClassId);
  });
});
