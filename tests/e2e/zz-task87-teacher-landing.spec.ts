import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { fetchWithRetry, loginCached } from './helpers/http';
import { cat, icu, loadMessages } from './helpers/i18n';

// Task 87 (st-mvp-pivot) targeted live check — NOT part of the suite.
// Teacher landing dashboard (C-TEACH-01, mvp-updates §4.9): sign-in lands the
// teacher on a populated dashboard, each class card shows its diagnostic and
// monitor summaries (populated or in the contract empty state), and the
// roster / test day / results links navigate. The guard test asserts the
// anonymous bounce to /sign-in. D-16: TeacherGuard is teacher-only, so
// school_admin never appears on this surface — the empty-state class is
// created for verify21 instead (the task 75 setup/cleanup pattern).
const en = loadMessages('en');

const API = 'http://127.0.0.1:5500';
const TEACHER = { email: process.env.E2E_TEACHER_EMAIL ?? 'teacher@schooltest.local', password: process.env.E2E_TEACHER_PASSWORD ?? 'Teacher1234!' };
const SCHOOL_ADMIN = { email: 'schooladmin-a@schooltest.local', password: process.env.E2E_SCHOOL_ADMIN_PASSWORD ?? 'SchoolAdmin1234!' };
const CLASS_ID = 'x1hat1dy90boz11n9zyphoan'; // "EAL/D Year 7 - Room 4"
const CLASS_NAME = 'EAL/D Year 7 - Room 4';

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

interface TeachHomeClassPayload {
  documentId: string;
  name: string;
  diagnostic: {
    sat_count: number;
    roster_count: number;
    latest_form: string | null;
    mastered_pct: number;
  } | null;
  monitor: {
    not_joined: number;
    joined: number;
    in_progress: number;
    submitted: number;
    stalled: number;
  } | null;
}

async function fetchTeachHome(
  request: APIRequestContext,
  jwt: string,
): Promise<TeachHomeClassPayload[]> {
  const res = await fetchWithRetry(() =>
    request.get(`${API}/api/schools/me/teach/home`, {
      headers: { Authorization: `Bearer ${jwt}` },
    }),
  );
  expect(res.ok()).toBeTruthy();
  return ((await res.json()) as { data: { classes: TeachHomeClassPayload[] } }).data.classes;
}

function classCard(page: Page, name: string) {
  return page
    .locator('[data-slot="teach-home-class-card"]')
    .filter({ has: page.getByRole('heading', { name, exact: true }) });
}

test.describe('task 87: teacher landing dashboard vs live C-TEACH-01', () => {
  // The timeout carries the 429 ride-out budget for batch runs (helpers/http.ts).
  test.describe.configure({ mode: 'serial', timeout: 120_000 });

  test('sign-in lands on the populated dashboard: diagnostic summary + no-sitting monitor', async ({
    page,
    request,
  }) => {
    // Content expectations come from the live C-TEACH-01 payload, never
    // pinned (the fixture class keeps evolving — see task 75).
    const jwt = await login(request, TEACHER);
    const classes = await fetchTeachHome(request, jwt);
    const fixture = classes.find((row) => row.documentId === CLASS_ID);
    expect(fixture).toBeTruthy();
    expect(fixture!.diagnostic).not.toBeNull();
    expect(fixture!.monitor).toBeNull(); // no sitting running right now

    await signIn(page, TEACHER);
    const home = page.locator('[data-slot="teach-home"]');
    await expect(home).toBeVisible({ timeout: 20_000 });
    await expect(
      home.getByRole('heading', { name: cat(en, 'Teach.home.title'), exact: true }),
    ).toBeVisible();

    const card = classCard(page, CLASS_NAME);
    await expect(card).toBeVisible();

    // Diagnostic panel populated: sat count, latest form, mastered percent —
    // the rendered strings equal the wire payload run through the catalog.
    const diagnostic = card.locator('[data-slot="diagnostic-summary"]');
    await expect(diagnostic).toBeVisible();
    await expect(
      diagnostic.getByText(
        icu(cat(en, 'Teach.home.panels.diagnostic.satValue'), {
          sat: String(fixture!.diagnostic!.sat_count),
          roster: String(fixture!.diagnostic!.roster_count),
        }),
        { exact: true },
      ),
    ).toBeVisible();
    await expect(
      diagnostic.getByText(fixture!.diagnostic!.latest_form ?? '', { exact: true }),
    ).toBeVisible();
    await expect(
      diagnostic.getByText(
        icu(cat(en, 'Teach.home.panels.diagnostic.masteredValue'), {
          pct: String(Math.round(fixture!.diagnostic!.mastered_pct)),
        }),
        { exact: true },
      ),
    ).toBeVisible();
    await expect(
      diagnostic.getByText(cat(en, 'Teach.home.panels.diagnostic.empty'), { exact: true }),
    ).toHaveCount(0);

    // Monitor panel in the no-sitting state (contract's monitor:null).
    const monitor = card.locator('[data-slot="monitor-summary"]');
    await expect(monitor).toBeVisible();
    await expect(
      monitor.getByText(cat(en, 'Teach.home.panels.monitor.empty'), { exact: true }),
    ).toBeVisible();
  });

  test('class card links navigate: results, test day, roster', async ({ page }) => {
    await signIn(page, TEACHER);
    const home = page.locator('[data-slot="teach-home"]');
    await expect(home).toBeVisible({ timeout: 20_000 });

    await classCard(page, CLASS_NAME)
      .getByRole('link', { name: cat(en, 'Teach.home.resultsLink'), exact: true })
      .click();
    await page.waitForURL(`**/dashboard/teach/results/${CLASS_ID}`);
    await expect(page.locator('[data-surface="teacher-diagnostic"]')).toBeVisible({
      timeout: 20_000,
    });

    await page.goto('/en/dashboard/teach');
    await expect(home).toBeVisible({ timeout: 20_000 });
    await classCard(page, CLASS_NAME)
      .getByRole('link', { name: cat(en, 'Teach.home.testDayLink'), exact: true })
      .click();
    await page.waitForURL(`**/dashboard/teach/classes/${CLASS_ID}/test-day`);
    await expect(page.locator('[data-surface="teacher-test-day"]')).toBeVisible({
      timeout: 20_000,
    });

    await page.goto('/en/dashboard/teach');
    await expect(home).toBeVisible({ timeout: 20_000 });
    await classCard(page, CLASS_NAME)
      .getByRole('link', { name: cat(en, 'Teach.home.rosterLink'), exact: true })
      .click();
    await page.waitForURL(`**/dashboard/teach/classes/${CLASS_ID}`);
    await expect(page.locator('[data-surface="teacher-roster"]')).toBeVisible({ timeout: 20_000 });
  });

  test('a results-free class renders the unpopulated panels (diagnostic:null, monitor:null)', async ({
    page,
    request,
  }) => {
    // Setup: a results-free class this spec owns, created via C-CLS-02 with
    // verify21 assigned (the task 75 pattern), deleted again at the end.
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
          name: `zz87 empty ${Date.now()}`,
          year_band: '7_9',
          teacher_documentIds: [verify21!.documentId],
        },
      }),
    );
    expect(create.status()).toBe(201);
    const emptyClass = ((await create.json()) as { data: { documentId: string; name: string } })
      .data;

    try {
      await signIn(page, TEACHER);
      const home = page.locator('[data-slot="teach-home"]');
      await expect(home).toBeVisible({ timeout: 20_000 });

      // Both classes render from first login: the populated fixture card and
      // the new card in the contract empty state — never a blank or an error.
      const emptyCard = classCard(page, emptyClass.name);
      await expect(emptyCard).toBeVisible();
      const diagnostic = emptyCard.locator('[data-slot="diagnostic-summary"]');
      await expect(
        diagnostic.getByText(cat(en, 'Teach.home.panels.diagnostic.empty'), { exact: true }),
      ).toBeVisible();
      await expect(
        emptyCard
          .locator('[data-slot="monitor-summary"]')
          .getByText(cat(en, 'Teach.home.panels.monitor.empty'), { exact: true }),
      ).toBeVisible();
      // Empty state shows no populated rows.
      await expect(diagnostic.locator('dl')).toHaveCount(0);
      await expect(classCard(page, CLASS_NAME)).toBeVisible();
    } finally {
      const cleanup = await fetchWithRetry(() =>
        request.delete(`${API}/api/schools/me/classes/${emptyClass.documentId}`, {
          headers: { Authorization: `Bearer ${adminJwt}` },
        }),
      );
      expect(cleanup.ok()).toBeTruthy();
    }
  });

  test('anonymous visit to /dashboard/teach redirects to sign-in', async ({ page }) => {
    await page.goto('/en/dashboard/teach');
    await page.waitForURL('**/sign-in', { timeout: 20_000 });
    await expect(page.locator('[data-slot="teach-home"]')).toHaveCount(0);
  });
});
