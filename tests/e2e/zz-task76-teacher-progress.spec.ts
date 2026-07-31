import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { cat, icu, loadMessages } from './helpers/i18n';

// Task 76 (st-mvp-pivot) targeted live check — NOT part of the suite.
// Teacher progress panel (C-RPT-02): Test B measured against Test A as the
// benchmark, transition statements per reading area (never raw probability
// arithmetic), the weeks between the two sittings, not_assessed called out
// explicitly (never "no change"), the WYSIWYG empty state until Test B
// results exist, and the error state on an unowned class.
const en = loadMessages('en');

const API = 'http://127.0.0.1:5500';
const TEACHER = { email: 'verify21@schooltest.local', password: 'Verify21!pw' };
const SCHOOL_ADMIN = { email: 'schooladmin-a@schooltest.local', password: 'pEbjxVnJ4PPYiv8D!A1' };
const SCHOOL_ADMIN_B = { email: 'schooladmin-b@schooltest.local', password: 'BT77uuUGgqVSpFkP!A1' };
const PARENT = { email: 'parent@schooltest.local', password: 'yvmnVObAiaOJw2C1!A1' };
const CLASS_ID = 'x1hat1dy90boz11n9zyphoan'; // "EAL/D Year 7 - Room 4" (Sofia P. holds the A/B chain)
// Results-free school-A class (task 75's empty-state class); the spec assigns
// verify21 to it via C-CLS-03 before visiting.
const EMPTY_CLASS_ID = 'sbxoff8ow7p1dfl14e6bpg8u';
// Orphan class with no school link: every school role 403s it.
const UNOWNED_CLASS_ID = 'bsonh15b2ggwe2rpyuudvzfa';

async function login(
  request: APIRequestContext,
  credentials: { email: string; password: string },
): Promise<string> {
  const res = await request.post(`${API}/api/auth/local`, {
    data: { identifier: credentials.email, password: credentials.password },
  });
  expect(res.ok()).toBeTruthy();
  return ((await res.json()) as { jwt: string }).jwt;
}

async function signIn(page: Page, credentials: { email: string; password: string }): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(credentials.email);
  await page
    .getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true })
    .fill(credentials.password);
  await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
  await page.waitForURL('**/dashboard', { timeout: 30_000 });
}

test.describe('task 76: teacher progress panel vs live C-RPT-02', () => {
  test.describe.configure({ mode: 'serial' });

  test('populated class: A/B forms, transitions, weeks, explicit not_assessed', async ({
    page,
    request,
  }) => {
    // API role matrix first: wrong school and wrong role 403, school_admin 200.
    const foreignJwt = await login(request, SCHOOL_ADMIN_B);
    const foreign = await request.get(`${API}/api/schools/me/classes/${CLASS_ID}/progress`, {
      headers: { Authorization: `Bearer ${foreignJwt}` },
    });
    expect(foreign.status()).toBe(403);
    const parentJwt = await login(request, PARENT);
    const parent = await request.get(`${API}/api/schools/me/classes/${CLASS_ID}/progress`, {
      headers: { Authorization: `Bearer ${parentJwt}` },
    });
    expect(parent.status()).toBe(403);
    const adminJwt = await login(request, SCHOOL_ADMIN);
    const admin = await request.get(`${API}/api/schools/me/classes/${CLASS_ID}/progress`, {
      headers: { Authorization: `Bearer ${adminJwt}` },
    });
    expect(admin.ok()).toBeTruthy();
    const payload = ((await admin.json()) as { data: { populated: boolean } }).data;
    expect(payload.populated).toBe(true);

    await signIn(page, TEACHER);
    await page.goto(`/en/dashboard/teach/results/${CLASS_ID}`);
    const panel = page.locator('[data-surface="teacher-progress"]');
    await expect(panel).toBeVisible({ timeout: 20_000 });
    await expect(
      panel.getByRole('heading', { name: cat(en, 'Teach.progress.title'), exact: true }),
    ).toBeVisible();

    // The A/B pair on the wire: benchmark Test A, progress Test B.
    await expect(
      panel.getByText(
        icu(cat(en, 'Teach.progress.formsLine'), {
          benchmark: 'RDG-FT-A-79',
          progress: 'RDG-FT-B-79',
        }),
        { exact: true },
      ),
    ).toBeVisible();

    // Sofia's real chain: benchmark spypwl5o (A) -> latest B miqhycrej.
    const student = panel.locator('[data-slot="progress-student"]', { hasText: 'Sofia P.' });
    await expect(student).toBeVisible();
    await expect(
      student.getByText(icu(cat(en, 'Teach.progress.weeksBetween'), { weeks: '0.1' }), {
        exact: true,
      }),
    ).toBeVisible();

    // Transition statements are plain statements about reading areas.
    const transitions = student.locator('[data-slot="progress-transition"]');
    await expect(transitions).toHaveCount(5);
    await expect(
      transitions.getByText('Decoding: steady at mastered', { exact: true }),
    ).toBeVisible();
    await expect(
      transitions.getByText('Gist: steady at emerging', { exact: true }),
    ).toBeVisible();
    await expect(
      transitions.getByText('Detail: steady at not mastered', { exact: true }),
    ).toBeVisible();

    // R6/R7 were not assessed on Test A: explicit not_assessed, never "no change".
    const notAssessed = student.locator('[data-slot="progress-not-assessed"]');
    await expect(notAssessed).toBeVisible();
    await expect(
      notAssessed.getByText(
        icu(cat(en, 'Teach.progress.notAssessedLine'), {
          areas: `${cat(en, 'Teach.diagnostic.areas.R6')}, ${cat(en, 'Teach.diagnostic.areas.R7')}`,
        }),
        { exact: true },
      ),
    ).toBeVisible();
    await expect(panel.getByText(/no change/i)).toHaveCount(0);
  });

  test('results-free class renders the contracted empty state', async ({ page, request }) => {
    // Setup: verify21 must sit in the class's teachers (C-RPT-02 object scope).
    const adminJwt = await login(request, SCHOOL_ADMIN);
    const teachersRes = await request.get(`${API}/api/schools/me/teachers`, {
      headers: { Authorization: `Bearer ${adminJwt}` },
    });
    expect(teachersRes.ok()).toBeTruthy();
    const teachers = ((await teachersRes.json()) as { data: Array<{ documentId: string; email: string }> })
      .data;
    const verify21 = teachers.find((row) => row.email === TEACHER.email);
    expect(verify21).toBeTruthy();
    const patch = await request.patch(`${API}/api/schools/me/classes/${EMPTY_CLASS_ID}`, {
      headers: { Authorization: `Bearer ${adminJwt}` },
      data: { teacher_documentIds: [verify21!.documentId] },
    });
    expect(patch.ok()).toBeTruthy();

    // The server-side empty state is a first-class payload.
    const teacherJwt = await login(request, TEACHER);
    const empty = await request.get(`${API}/api/schools/me/classes/${EMPTY_CLASS_ID}/progress`, {
      headers: { Authorization: `Bearer ${teacherJwt}` },
    });
    expect(empty.ok()).toBeTruthy();
    const body = (await empty.json()) as {
      data: { populated: boolean; reason: string; benchmark_form: string; progress_form: string | null };
    };
    expect(body.data.populated).toBe(false);
    expect(body.data.reason).toBe('no_test_b_results');
    expect(body.data.benchmark_form).toBe('RDG-FT-A-79');
    expect(body.data.progress_form).toBeNull();

    await signIn(page, TEACHER);
    await page.goto(`/en/dashboard/teach/results/${EMPTY_CLASS_ID}`);
    const panel = page.locator('[data-surface="teacher-progress"]');
    await expect(panel).toBeVisible({ timeout: 20_000 });
    const emptyState = panel.locator('[data-slot="progress-empty-state"]');
    await expect(emptyState).toBeVisible();
    // "progress data coming once Test B has been completed" (mvp-updates §4.9).
    await expect(
      emptyState.getByText(cat(en, 'Teach.progress.emptyTitle'), { exact: true }),
    ).toBeVisible();
    await expect(panel.locator('[data-slot="progress-student"]')).toHaveCount(0);
  });

  test('an unowned class renders the error state, never a leak', async ({ page }) => {
    await signIn(page, TEACHER);
    await page.goto(`/en/dashboard/teach/results/${UNOWNED_CLASS_ID}`);
    const panel = page.locator('[data-surface="teacher-progress"]');
    await expect(panel).toBeVisible({ timeout: 20_000 });
    await expect(
      panel.getByRole('alert').getByText(cat(en, 'Teach.progress.loadError'), { exact: true }),
    ).toBeVisible({ timeout: 20_000 }); // TanStack default retries the 403 before isError
    await expect(panel.locator('[data-slot="progress-student"]')).toHaveCount(0);
  });
});
