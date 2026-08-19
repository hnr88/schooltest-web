import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { fetchWithRetry, loginCached } from './helpers/http';
import { cat, icu, loadMessages } from './helpers/i18n';

// Task 76 (st-mvp-pivot) targeted live check — NOT part of the suite.
// Teacher progress panel (C-RPT-02): Test B measured against Test A as the
// benchmark, transition statements per reading area (never raw probability
// arithmetic), the weeks between the two sittings, not_assessed called out
// explicitly (never "no change"), the WYSIWYG empty state until Test B
// results exist, and the error state on an unowned class.
const en = loadMessages('en');

const API = 'http://127.0.0.1:5500';
const TEACHER = { email: process.env.E2E_TEACHER_EMAIL ?? 'teacher@schooltest.local', password: process.env.E2E_TEACHER_PASSWORD ?? 'Teacher1234!' };
const SCHOOL_ADMIN = { email: 'schooladmin-a@schooltest.local', password: 'pEbjxVnJ4PPYiv8D!A1' };
const SCHOOL_ADMIN_B = { email: 'schooladmin-b@schooltest.local', password: 'BT77uuUGgqVSpFkP!A1' };
const PARENT = { email: 'parent@schooltest.local', password: 'yvmnVObAiaOJw2C1!A1' };
const CLASS_ID = 'x1hat1dy90boz11n9zyphoan'; // "EAL/D Year 7 - Room 4" (Sofia P. holds the A/B chain)
// Orphan class with no school link: every school role 403s it.
const UNOWNED_CLASS_ID = 'bsonh15b2ggwe2rpyuudvzfa';

async function login(
  request: APIRequestContext,
  credentials: { email: string; password: string },
): Promise<string> {
  return loginCached(request, API, credentials);
}

async function signIn(page: Page, credentials: { email: string; password: string }): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(credentials.email);
  await page
    .getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true })
    .fill(credentials.password);
  await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
  // Wait for the SETTLED role landing (not the transient /dashboard hop), so a
  // late role redirect can never hijack the goto that follows. The axios
  // layer rides out any 429 on the auth POST, so allow for that here.
  await page.waitForURL('**/dashboard/teach**', { timeout: 90_000 });
}

interface ProgressPayload {
  populated: boolean;
  reason: string | null;
  benchmark_form: string | null;
  progress_form: string | null;
  students: Array<{
    student_ref: string;
    transitions: Array<{
      attribute: string;
      from_status: 'mastered' | 'emerging' | 'not_mastered';
      to_status: 'mastered' | 'emerging' | 'not_mastered';
    }>;
    weeks_between: number;
  }>;
  not_assessed: Array<{ student_ref: string; attribute: string }>;
}

test.describe('task 76: teacher progress panel vs live C-RPT-02', () => {
  // The timeout carries the 429 ride-out budget for batch runs (helpers/http.ts).
  test.describe.configure({ mode: 'serial', timeout: 120_000 });

  test('populated class: A/B forms, transitions, weeks, explicit not_assessed', async ({
    page,
    request,
  }) => {
    // API role matrix first: wrong school and wrong role 403, school_admin 200.
    const foreignJwt = await login(request, SCHOOL_ADMIN_B);
    const foreign = await fetchWithRetry(() =>
      request.get(`${API}/api/schools/me/classes/${CLASS_ID}/progress`, {
        headers: { Authorization: `Bearer ${foreignJwt}` },
      }),
    );
    expect(foreign.status()).toBe(403);
    const parentJwt = await login(request, PARENT);
    const parent = await fetchWithRetry(() =>
      request.get(`${API}/api/schools/me/classes/${CLASS_ID}/progress`, {
        headers: { Authorization: `Bearer ${parentJwt}` },
      }),
    );
    expect(parent.status()).toBe(403);
    const adminJwt = await login(request, SCHOOL_ADMIN);
    const admin = await fetchWithRetry(() =>
      request.get(`${API}/api/schools/me/classes/${CLASS_ID}/progress`, {
        headers: { Authorization: `Bearer ${adminJwt}` },
      }),
    );
    expect(admin.ok()).toBeTruthy();
    const payload = ((await admin.json()) as { data: ProgressPayload }).data;
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
          benchmark: payload.benchmark_form ?? '-',
          progress: payload.progress_form ?? '-',
        }),
        { exact: true },
      ),
    ).toBeVisible();

    // Sofia's real chain: every content expectation is computed from the live
    // C-RPT-02 payload (the fixture keeps evolving through re-sits — never
    // pinned to a sitting count or a specific chain).
    const sofia = payload.students.find((row) => row.student_ref === 'Sofia P.');
    expect(sofia).toBeTruthy();
    const student = panel.locator('[data-slot="progress-student"]', { hasText: 'Sofia P.' });
    await expect(student).toBeVisible();
    await expect(
      student.getByText(icu(cat(en, 'Teach.progress.weeksBetween'), {
        weeks: String(sofia!.weeks_between),
      }), {
        exact: true,
      }),
    ).toBeVisible();

    // Transition statements are plain statements about reading areas, rendered
    // exactly as ProgressTransitionRow builds them from the wire statuses.
    const transitions = student.locator('[data-slot="progress-transition"]');
    await expect(transitions).toHaveCount(sofia!.transitions.length);
    for (const transition of sofia!.transitions) {
      const area = cat(en, `Teach.diagnostic.areas.${transition.attribute}`);
      const fromWord = cat(en, `Teach.progress.statusWord.${transition.from_status}`);
      const label =
        transition.from_status === transition.to_status
          ? icu(cat(en, 'Teach.progress.transitionSteady'), { area, status: fromWord })
          : icu(cat(en, 'Teach.progress.transition'), {
              area,
              from: fromWord,
              to: cat(en, `Teach.progress.statusWord.${transition.to_status}`),
            });
      await expect(transitions.getByText(label, { exact: true }).first()).toBeVisible();
    }

    // Areas not assessed on one or both forms: explicit not_assessed, never "no change".
    const notAssessedAreas = payload.not_assessed
      .filter((row) => row.student_ref === 'Sofia P.')
      .map((row) => cat(en, `Teach.diagnostic.areas.${row.attribute}`));
    const notAssessed = student.locator('[data-slot="progress-not-assessed"]');
    if (notAssessedAreas.length > 0) {
      await expect(notAssessed).toBeVisible();
      await expect(
        notAssessed.getByText(
          icu(cat(en, 'Teach.progress.notAssessedLine'), { areas: notAssessedAreas.join(', ') }),
          { exact: true },
        ),
      ).toBeVisible();
    } else {
      await expect(notAssessed).toHaveCount(0);
    }
    await expect(panel.getByText(/no change/i)).toHaveCount(0);
  });

  test('results-free class renders the contracted empty state', async ({ page, request }) => {
    // Setup: a results-free class this spec owns (the original probe class was
    // deleted from the shared fixture): created via C-CLS-02 with verify21
    // assigned (C-RPT-02 object scope), deleted again at the end.
    const adminJwt = await login(request, SCHOOL_ADMIN);
    const teachersRes = await fetchWithRetry(() =>
      request.get(`${API}/api/schools/me/teachers`, {
        headers: { Authorization: `Bearer ${adminJwt}` },
      }),
    );
    expect(teachersRes.ok()).toBeTruthy();
    const teachers = ((await teachersRes.json()) as { data: Array<{ documentId: string; email: string }> })
      .data;
    const verify21 = teachers.find((row) => row.email === TEACHER.email);
    expect(verify21).toBeTruthy();
    const create = await fetchWithRetry(() =>
      request.post(`${API}/api/schools/me/classes`, {
        headers: { Authorization: `Bearer ${adminJwt}` },
        data: {
          name: `zz76 empty ${Date.now()}`,
          year_band: '7_9',
          teacher_documentIds: [verify21!.documentId],
        },
      }),
    );
    expect(create.status()).toBe(201);
    const emptyClassId = ((await create.json()) as { data: { documentId: string } }).data
      .documentId;

    try {
      // The server-side empty state is a first-class payload. The benchmark
      // form is the year band's resolved pair — read off the fixture class
      // (same band), never pinned.
      const teacherJwt = await login(request, TEACHER);
      const fixtureProgress = await fetchWithRetry(() =>
        request.get(`${API}/api/schools/me/classes/${CLASS_ID}/progress`, {
          headers: { Authorization: `Bearer ${teacherJwt}` },
        }),
      );
      expect(fixtureProgress.ok()).toBeTruthy();
      const fixtureBody = ((await fixtureProgress.json()) as { data: ProgressPayload }).data;
      const empty = await fetchWithRetry(() =>
        request.get(`${API}/api/schools/me/classes/${emptyClassId}/progress`, {
          headers: { Authorization: `Bearer ${teacherJwt}` },
        }),
      );
      expect(empty.ok()).toBeTruthy();
      const body = ((await empty.json()) as { data: ProgressPayload }).data;
      expect(body.populated).toBe(false);
      expect(body.reason).toBe('no_test_b_results');
      expect(body.benchmark_form).toBe(fixtureBody.benchmark_form);
      expect(body.progress_form).toBeNull();

      await signIn(page, TEACHER);
      await page.goto(`/en/dashboard/teach/results/${emptyClassId}`);
      const panel = page.locator('[data-surface="teacher-progress"]');
      await expect(panel).toBeVisible({ timeout: 20_000 });
      const emptyState = panel.locator('[data-slot="progress-empty-state"]');
      await expect(emptyState).toBeVisible();
      // "progress data coming once Test B has been completed" (mvp-updates §4.9).
      await expect(
        emptyState.getByText(cat(en, 'Teach.progress.emptyTitle'), { exact: true }),
      ).toBeVisible();
      await expect(panel.locator('[data-slot="progress-student"]')).toHaveCount(0);
    } finally {
      const cleanup = await fetchWithRetry(() =>
        request.delete(`${API}/api/schools/me/classes/${emptyClassId}`, {
          headers: { Authorization: `Bearer ${adminJwt}` },
        }),
      );
      expect(cleanup.ok()).toBeTruthy();
    }
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
