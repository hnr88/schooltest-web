import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { fetchWithRetry, loginCached } from './helpers/http';
import { cat, icu, loadMessages } from './helpers/i18n';
import { fixtureClassId } from './helpers/fixture-class';
import { roleCredentials } from './helpers/credentials';

// Task 75 (st-mvp-pivot) targeted live check — NOT part of the suite.
// Teacher diagnostic dashboard (C-RPT-01): class mastery list across the seven
// reading areas with the item-type heat map nested underneath (item code +
// section only, items correct / responses), the one-click student drill-down,
// the WYSIWYG empty state on a results-free class, and the error state on an
// unowned class. ACARA phase never reaches the DOM (D-10 / mvp spec 4.4).
const en = loadMessages('en');

const API = 'http://127.0.0.1:5500';
const TEACHER = roleCredentials('teacher');
const SCHOOL_ADMIN = roleCredentials('schoolAdmin');
/**
 * A GENUINELY foreign teacher. This was `roleCredentials('teacher')` — the SAME
 * ACCOUNT as TEACHER above — so the "foreign teacher is refused" assertion below
 * was asking whether a teacher is refused their OWN class. Measured: `teacher`
 * gets 200 on CLASS_ID, so `toBe(403)` could not pass. The alias was not
 * carelessness: until teacher2 was seeded (schooltest-api 658a849) there was no
 * other teacher in the database to point it at.
 *
 * teacher2 is in the SAME school on purpose. A teacher from another school
 * would be refused for TENANCY reasons and this assertion would go green
 * without proving anything about OWNERSHIP.
 */
const FOREIGN_TEACHER = roleCredentials('teacher2');
const PARENT = roleCredentials('parent');
const CLASS_ID = fixtureClassId(); // "EAL/D Year 7 - Room 4"
const CLASS_NAME = 'EAL/D Year 7 - Room 4';
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
  await page.waitForURL(/\/dashboard(\/|$)/, { timeout: 90_000 });
}

interface DiagnosticPayload {
  sat_count: number;
  roster_count: number;
  mastery: Array<{
    student_ref: string;
    attributes: Array<{ code: string; status: string }>;
  }>;
  heatmap: Array<{
    item_code: string;
    section: number;
    correct: number;
    responses: number;
    fraction: number;
  }>;
}

test.describe('task 75: teacher diagnostic dashboard vs live C-RPT-01', () => {
  // The timeout carries the 429 ride-out budget for batch runs (helpers/http.ts).
  test.describe.configure({ mode: 'serial', timeout: 120_000 });

  test('populated class: mastery list, nested heat map, drill-down, no ACARA phase', async ({
    page,
    request,
  }) => {
    // API role matrix first: foreign teacher and parent 403, school_admin 200.
    const foreignJwt = await login(request, FOREIGN_TEACHER);
    const foreign = await fetchWithRetry(() =>
      request.get(`${API}/api/schools/me/classes/${CLASS_ID}/diagnostic`, {
        headers: { Authorization: `Bearer ${foreignJwt}` },
      }),
    );
    expect(foreign.status()).toBe(403);
    const parentJwt = await login(request, PARENT);
    const parent = await fetchWithRetry(() =>
      request.get(`${API}/api/schools/me/classes/${CLASS_ID}/diagnostic`, {
        headers: { Authorization: `Bearer ${parentJwt}` },
      }),
    );
    expect(parent.status()).toBe(403);
    const adminJwt = await login(request, SCHOOL_ADMIN);
    const admin = await fetchWithRetry(() =>
      request.get(`${API}/api/schools/me/classes/${CLASS_ID}/diagnostic`, {
        headers: { Authorization: `Bearer ${adminJwt}` },
      }),
    );
    expect(admin.ok()).toBeTruthy();

    // The fixture class keeps evolving (bulk-import roster growth, re-sit
    // sessions): every content expectation below is computed from the live
    // C-RPT-01 payload, never pinned to a roster size or a sitting count.
    const teacherJwt = await login(request, TEACHER);
    const diagnosticRes = await fetchWithRetry(() =>
      request.get(`${API}/api/schools/me/classes/${CLASS_ID}/diagnostic`, {
        headers: { Authorization: `Bearer ${teacherJwt}` },
      }),
    );
    expect(diagnosticRes.ok()).toBeTruthy();
    const diagnostic = ((await diagnosticRes.json()) as { data: DiagnosticPayload }).data;
    expect(diagnostic.sat_count).toBeGreaterThan(0);
    expect(diagnostic.heatmap.length).toBeGreaterThan(0);

    await signIn(page, TEACHER);
    await page.goto('/en/dashboard/teach');
    const home = page.locator('[data-surface="teacher-home"]');
    await expect(home).toBeVisible({ timeout: 20_000 });
    await home
      .locator('li', { hasText: CLASS_NAME })
      .getByRole('link', { name: cat(en, 'Teach.home.resultsLink'), exact: true })
      .click();
    await page.waitForURL(`**/dashboard/teach/results/${CLASS_ID}`);

    const screen = page.locator('[data-surface="teacher-diagnostic"]');
    await expect(screen).toBeVisible();
    await expect(screen.getByRole('heading', { name: CLASS_NAME, exact: true })).toBeVisible();
    await expect(
      screen.getByText(
        icu(cat(en, 'Teach.diagnostic.summary'), {
          sat: String(diagnostic.sat_count),
          roster: String(diagnostic.roster_count),
        }),
        { exact: false },
      ),
    ).toBeVisible();

    // Mastery: a list (never a grid) of students with the seven area pills;
    // every status on the wire renders at least one pill.
    const mastery = screen.locator('[data-slot="mastery-table"]');
    await expect(mastery).toBeVisible();
    await expect(mastery.getByText('Sofia P.', { exact: true })).toBeVisible();
    const statuses = new Set(
      diagnostic.mastery.flatMap((row) => row.attributes.map((attribute) => attribute.status)),
    );
    for (const status of statuses) {
      await expect(
        mastery.getByText(cat(en, `Teach.diagnostic.status.${status}`), { exact: true }).first(),
      ).toBeVisible();
    }

    // Heat map: nested under the mastery section, cells keyed by item code +
    // section only, framed as items correct / responses — the rendered values
    // equal the wire rows exactly (formatHeatmapValue in heatmap-view-model).
    const heatmap = screen.locator('[data-slot="item-type-heatmap"]');
    await expect(heatmap).toBeVisible();
    const sections = [...new Set(diagnostic.heatmap.map((row) => row.section))];
    for (const section of sections) {
      await expect(
        heatmap.getByText(icu(cat(en, 'Teach.diagnostic.sectionHeading'), {
          section: String(section),
        }), { exact: true }),
      ).toBeVisible();
    }
    for (const row of diagnostic.heatmap) {
      const value = `${row.correct}/${row.responses} (${Math.round(row.fraction * 100)}%)`;
      await expect(heatmap.getByText(value, { exact: true }).first()).toBeVisible();
    }
    await expect(
      heatmap.getByText(diagnostic.heatmap[0]!.item_code, { exact: true }),
    ).toBeVisible();

    // Drill-down: one click to the individual level, then close.
    await mastery.getByRole('button', { name: /Sofia P\./ }).click();
    const drilldown = screen.locator('[data-slot="student-mastery-drilldown"]');
    await expect(drilldown).toBeVisible();
    await expect(
      drilldown.getByRole('heading', {
        name: icu(cat(en, 'Teach.diagnostic.drilldownTitle'), { student: 'Sofia P.' }),
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      drilldown.getByText(cat(en, 'Teach.diagnostic.areas.R7'), { exact: true }),
    ).toBeVisible();
    await drilldown
      .getByRole('button', { name: cat(en, 'Teach.diagnostic.drilldownClose'), exact: true })
      .click();
    await expect(drilldown).toHaveCount(0);

    // D-10 / mvp spec 4.4: ACARA phase never reaches the teacher DOM.
    const text = (await screen.textContent())?.toLowerCase() ?? '';
    expect(text).not.toContain('acara');
    expect(text).not.toContain('phase');
  });

  test('results-free class renders the WYSIWYG empty state', async ({ page, request }) => {
    // Setup: a results-free class this spec owns (the original probe class was
    // deleted from the shared fixture): created via C-CLS-02 with verify21
    // assigned (C-RPT-01 object scope), deleted again at the end.
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
          name: `zz75 empty ${Date.now()}`,
          year_band: '7_9',
          teacher_documentIds: [verify21!.documentId],
        },
      }),
    );
    expect(create.status()).toBe(201);
    const emptyClassId = ((await create.json()) as { data: { documentId: string } }).data
      .documentId;

    try {
      await signIn(page, TEACHER);
      await page.goto(`/en/dashboard/teach/results/${emptyClassId}`);
      const screen = page.locator('[data-surface="teacher-diagnostic"]');
      await expect(screen).toBeVisible({ timeout: 20_000 });
      const empty = screen.locator('[data-slot="diagnostic-empty-state"]');
      await expect(empty).toBeVisible();
      // Both panels present but unpopulated: the full dashboard shape from first login.
      await expect(
        empty.getByText(cat(en, 'Teach.diagnostic.emptyMasteryTitle'), { exact: true }),
      ).toBeVisible();
      await expect(
        empty.getByText(cat(en, 'Teach.diagnostic.emptyHeatmapTitle'), { exact: true }),
      ).toBeVisible();
      await expect(screen.locator('[data-slot="mastery-table"]')).toHaveCount(0);
      await expect(screen.locator('[data-slot="item-type-heatmap"]')).toHaveCount(0);
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
    const screen = page.locator('[data-surface="teacher-diagnostic"]');
    await expect(screen).toBeVisible({ timeout: 20_000 });
    await expect(
      screen.getByRole('alert').getByText(cat(en, 'Teach.diagnostic.loadError'), { exact: true }),
    ).toBeVisible({ timeout: 20_000 }); // TanStack default retries the 403 before isError
    await expect(screen.locator('[data-slot="mastery-table"]')).toHaveCount(0);
  });
});
