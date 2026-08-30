import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { fetchWithRetry, loginCached } from './helpers/http';
import { cat, icu, loadMessages } from './helpers/i18n';
import { fixtureClassId } from './helpers/fixture-class';
import { fixtureTeacherCredentials, roleCredentials } from './helpers/credentials';

// Task 76 (st-mvp-pivot) targeted live check — NOT part of the suite.
// Teacher progress panel (C-RPT-02): Test B measured against Test A as the
// benchmark, transition statements per reading area (never raw probability
// arithmetic), the weeks between the two sittings, not_assessed called out
// explicitly (never "no change"), the WYSIWYG empty state until Test B
// results exist, and the error state on an unowned class.
const en = loadMessages('en');

const API = 'http://127.0.0.1:5500';
const TEACHER = fixtureTeacherCredentials();
const TEACHER2 = roleCredentials('teacher2');
const SCHOOL_ADMIN = roleCredentials('schoolAdmin');
const SCHOOL_ADMIN_B = roleCredentials('schoolAdminB');
const PARENT = roleCredentials('parent');
const CLASS_ID = fixtureClassId(); // "EAL/D Year 7 - Room 4" (Sofia P. holds the A/B chain)
/**
 * teacher2's seeded class (schooltest-api 658a849), resolved by NAME — never a
 * pinned documentId (fixture-class.ts explains why no fixture can promise one).
 * The signed-in TEACHER does not own it, so the live server refuses it on
 * OWNERSHIP grounds. The error-state test below MANUFACTURES that refusal with
 * a route intercept instead of hoping the fixture produces one, so it can never
 * go green against a 404, a dead record or a crashed component — the failure
 * mode this file's old dead-id navigation had.
 */
const FOREIGN_CLASS_NAME = 'EAL/D Year 9 - Room 6';
const FOREIGN_CLASS_ID = fixtureClassId(FOREIGN_CLASS_NAME);

async function login(
  request: APIRequestContext,
  credentials: { email: string; password: string },
): Promise<string> {
  return loginCached(request, API, credentials);
}

async function signIn(page: Page, credentials: { email: string; password: string }): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(credentials.email);
  await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(credentials.password);
  await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
  // Wait for the SETTLED role landing (not the transient /dashboard hop), so a
  // late role redirect can never hijack the goto that follows. The axios
  // layer rides out any 429 on the auth POST, so allow for that here.
  await page.waitForURL(/\/dashboard(\/|$)/, { timeout: 90_000 });
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
    // API role matrix first: wrong school, wrong role AND a same-school
    // non-owner 403, school_admin 200. teacher2 is in the SAME school as the
    // class owner, so their 403 is an OWNERSHIP refusal, not a tenancy one
    // (schoolAdminB above covers tenancy) — and it is PAIRED with school_admin's
    // 200, because a lone 403 could be a broken fixture rather than a refusal.
    // zz-task75 proves the same pairing on the diagnostic surface.
    const foreignJwt = await login(request, SCHOOL_ADMIN_B);
    const foreign = await fetchWithRetry(() =>
      request.get(`${API}/api/schools/me/classes/${CLASS_ID}/progress`, {
        headers: { Authorization: `Bearer ${foreignJwt}` },
      }),
    );
    expect(foreign.status()).toBe(403);
    const foreignTeacherJwt = await login(request, TEACHER2);
    const foreignTeacher = await fetchWithRetry(() =>
      request.get(`${API}/api/schools/me/classes/${CLASS_ID}/progress`, {
        headers: { Authorization: `Bearer ${foreignTeacherJwt}` },
      }),
    );
    expect(foreignTeacher.status()).toBe(403);
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

    // One real compared chain: every content expectation is computed from the live
    // C-RPT-02 payload (the fixture keeps evolving through re-sits — never
    // pinned to a sitting count or a specific learner name).
    const compared = payload.students[0];
    expect(compared).toBeTruthy();
    const student = panel.locator('[data-slot="progress-student"]', {
      hasText: compared.student_ref,
    });
    await expect(student).toBeVisible();
    await expect(
      student.getByText(
        icu(cat(en, 'Teach.progress.weeksBetween'), {
          weeks: String(compared.weeks_between),
        }),
        {
          exact: true,
        },
      ),
    ).toBeVisible();

    // Transition statements are plain statements about reading areas, rendered
    // exactly as ProgressTransitionRow builds them from the wire statuses.
    const transitions = student.locator('[data-slot="progress-transition"]');
    await expect(transitions).toHaveCount(compared.transitions.length);
    for (const transition of compared.transitions) {
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
      .filter((row) => row.student_ref === compared.student_ref)
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
    const teachers = (
      (await teachersRes.json()) as { data: Array<{ documentId: string; email: string }> }
    ).data;
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

  test('a refused class renders the error state, never a leak', async ({ page }) => {
    await signIn(page, TEACHER);
    // The refusal is MANUFACTURED, not hoped for. This test used to navigate to
    // a dead documentId: the endpoint answered 404, the SAME generic error
    // state rendered, and the test stayed green while proving nothing about
    // access control — 403, 404, a network fault and a crashed component were
    // indistinguishable to it. Instead the page's own class-scoped GETs are
    // answered with the 403 the live API really returns for a non-owner (see
    // the paired foreign-teacher/school_admin assertions in the first test),
    // using the shape from teacher-results-export.spec.ts's injected failure:
    // a test that controls its own failure condition cannot be fooled about
    // which condition it tested. Flip the injected status to 200 and this goes
    // red.
    const refusal = `**/api/schools/me/classes/${FOREIGN_CLASS_ID}/**`;
    await page.route(refusal, (route) =>
      route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ error: { message: 'You do not own this class' } }),
      }),
    );
    try {
      await page.goto(`/en/dashboard/teach/results/${FOREIGN_CLASS_ID}`);
      const panel = page.locator('[data-surface="teacher-progress"]');
      await expect(panel).toBeVisible({ timeout: 20_000 });
      await expect(
        panel.getByRole('alert').getByText(cat(en, 'Teach.progress.loadError'), { exact: true }),
      ).toBeVisible({ timeout: 20_000 }); // TanStack default retries the 403 before isError
      await expect(panel.locator('[data-slot="progress-student"]')).toHaveCount(0);
    } finally {
      await page.unroute(refusal);
    }
  });
});
