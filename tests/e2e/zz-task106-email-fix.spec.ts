import { expect, test, type APIRequestContext, type Browser, type Page } from '@playwright/test';

import { fetchWithRetry, loginCached } from './helpers/http';
import { cat, icu, loadMessages } from './helpers/i18n';

// Task 106 (st-mvp-pivot) live check: the full W16 email-fix handoff loop
// (C-CHD-05, mvp-updates spec 4.4) across both roles. The teacher flags a
// throwaway student's email on the class roster (toast + pending badge, still
// there after reload from server data), the school_admin sees the badge on the
// students page and the notification in their feed, the admin corrects the
// email in the edit dialog, and both indicators clear. No mocks: setup and
// teardown run through the real C-CHD-02/03/04 endpoints, and the throwaway
// child is archived at the end so the fixture roster stays clean. The W18
// notification feed page is not built yet, so the notification is asserted
// through the real C-NOTIF-LIST API (per the task's assumption).
const en = loadMessages('en');

const API = 'http://127.0.0.1:5500';
const TEACHER = { email: process.env.E2E_TEACHER_EMAIL ?? 'teacher@schooltest.local', password: process.env.E2E_TEACHER_PASSWORD ?? 'Teacher1234!' };
const SCHOOL_ADMIN = { email: 'schooladmin-a@schooltest.local', password: process.env.E2E_SCHOOL_ADMIN_PASSWORD ?? 'SchoolAdmin1234!' };
const CLASS_ID = 'x1hat1dy90boz11n9zyphoan'; // "EAL/D Year 7 - Room 4"

// The throwaway child this spec owns. The family name carries a per-run
// suffix so the search needle never matches archived residue from earlier
// runs, and the notification copy names the child as given name + family
// initial.
const CHILD_GIVEN = 'Zz106 Probe';
const CHILD_FAMILY = `Emailfix${Date.now().toString(36)}`;
const CHILD_NAME = `${CHILD_GIVEN} ${CHILD_FAMILY}`;
const CHILD_SHORT_NAME = `${CHILD_GIVEN} E.`;
const FIXED_EMAIL = 'zz106.probe@schooltest.test';

async function login(
  request: APIRequestContext,
  credentials: { email: string; password: string },
): Promise<string> {
  return loginCached(request, API, credentials);
}

async function signIn(
  page: Page,
  credentials: { email: string; password: string },
  landingGlob: string,
): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(credentials.email);
  await page
    .getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true })
    .fill(credentials.password);
  await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
  // Wait for the SETTLED role landing (not the transient /dashboard hop), so a
  // late role redirect can never hijack the goto that follows.
  await page.waitForURL(landingGlob, { timeout: 90_000 });
}

// A fresh browser context per role within one test: the auth token is
// persisted client-side, so a second sign-in on the same page would fight the
// first session. The context always closes, even on failure.
async function withRolePage(
  browser: Browser,
  baseURL: string | undefined,
  run: (page: Page) => Promise<void>,
): Promise<void> {
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();
  try {
    await run(page);
  } finally {
    await context.close();
  }
}

async function openTeacherRoster(page: Page) {
  await signIn(page, TEACHER, '**/dashboard**');
  await page.goto(`/en/dashboard/teach/classes/${CLASS_ID}`);
  const screen = page.locator('[data-surface="teacher-roster"]');
  await expect(screen).toBeVisible({ timeout: 20_000 });
  const row = screen.getByRole('row', { name: new RegExp(CHILD_NAME) });
  await expect(row).toBeVisible();
  return { screen, row };
}

async function openAdminChildren(page: Page) {
  await signIn(page, SCHOOL_ADMIN, '**/dashboard/school**');
  await page.goto('/en/dashboard/school/students');
  const screen = page.locator('[data-surface="school-admin-students"]');
  await expect(screen).toBeVisible({ timeout: 20_000 });
  // The family name is the unique search needle (debounced 300ms); the row
  // assertion retries until the filtered page lands.
  await screen.locator('#students-search').fill(CHILD_FAMILY);
  const row = screen.getByRole('row', { name: new RegExp(CHILD_NAME) });
  await expect(row).toBeVisible();
  return { screen, row };
}

// The pending badge on the teacher roster row (one catalog string, however
// the state underneath reached the row).
function teacherPendingBadge(row: ReturnType<Page['getByRole']>) {
  return row.getByText(cat(en, 'Teach.roster.emailFixPending'), { exact: true });
}

// The email-fix badge on the admin children row.
function adminFixBadge(row: ReturnType<Page['getByRole']>) {
  return row.getByText(cat(en, 'SchoolStudents.table.emailFixRequested'), { exact: true });
}

test.describe('task 106: email-fix handoff loop vs the live stack', () => {
  // The timeout carries the 429 ride-out budget for batch runs (helpers/http.ts).
  test.describe.configure({ mode: 'serial', timeout: 120_000 });

  let childDocumentId: string;

  test.beforeAll(async ({ request }) => {
    // Setup: a throwaway child in school A, placed in the fixture class so the
    // teacher roster shows it (C-CHD-02 as the school_admin).
    const adminJwt = await login(request, SCHOOL_ADMIN);
    const create = await fetchWithRetry(() =>
      request.post(`${API}/api/schools/me/children`, {
        headers: { Authorization: `Bearer ${adminJwt}` },
        data: {
          given_name: CHILD_GIVEN,
          family_name: CHILD_FAMILY,
          year_level: 7,
          class_documentId: CLASS_ID,
        },
      }),
    );
    expect(create.status()).toBe(201);
    childDocumentId = ((await create.json()) as { data: { documentId: string } }).data.documentId;
  });

  test.afterAll(async ({ request }) => {
    // Teardown: force the flag off (setting an email auto-clears it via
    // C-CHD-03, so even a mid-loop failure leaves no flagged student), unlink
    // the class and archive the throwaway child (C-CHD-04) — the fixture
    // class roster ends exactly as it started.
    const adminJwt = await login(request, SCHOOL_ADMIN);
    const headers = { Authorization: `Bearer ${adminJwt}` };
    await fetchWithRetry(() =>
      request.patch(`${API}/api/schools/me/children/${childDocumentId}`, {
        headers,
        data: { email: FIXED_EMAIL, class_documentId: null },
      }),
    );
    const archive = await fetchWithRetry(() =>
      request.post(`${API}/api/schools/me/children/${childDocumentId}/archive`, { headers }),
    );
    expect(archive.ok()).toBeTruthy();
  });

  test('teacher: flag from the roster, toast and pending badge, badge survives reload', async ({
    page,
  }) => {
    const { row } = await openTeacherRoster(page);

    const action = row.locator('[data-slot="email-fix-action"]');
    await expect(action).toBeVisible();
    await expect(action).toHaveText(cat(en, 'Teach.roster.emailFixAction'));

    await action.click();
    await expect(
      page.getByText(cat(en, 'Teach.roster.emailFixSuccessToast'), { exact: true }),
    ).toBeVisible();
    await expect(teacherPendingBadge(row)).toBeVisible();
    await expect(action).toHaveCount(0);

    // The flag is server truth: after a full reload the badge is still there
    // and the action stays swapped out (the D-18 session-side gap is closed).
    await page.reload();
    const screen = page.locator('[data-surface="teacher-roster"]');
    await expect(screen).toBeVisible({ timeout: 20_000 });
    const reloadedRow = screen.getByRole('row', { name: new RegExp(CHILD_NAME) });
    await expect(teacherPendingBadge(reloadedRow)).toBeVisible();
    await expect(reloadedRow.locator('[data-slot="email-fix-action"]')).toHaveCount(0);
  });

  test('admin: badge on the students page and the notification in the feed', async ({
    page,
    request,
  }) => {
    const { row } = await openAdminChildren(page);
    await expect(adminFixBadge(row)).toBeVisible();

    // The notification feed page belongs to W18, so the row is asserted
    // through the real C-NOTIF-LIST API: the school's school_admin got the
    // student_email_fix_requested event naming the child and pointing at this
    // very surface.
    const adminJwt = await login(request, SCHOOL_ADMIN);
    const res = await fetchWithRetry(() =>
      request.get(`${API}/api/notifications?eventType=student_email_fix_requested&pageSize=100`, {
        headers: { Authorization: `Bearer ${adminJwt}` },
      }),
    );
    expect(res.ok()).toBeTruthy();
    const rows = (
      (await res.json()) as {
        data: Array<{ title: string; body: string | null; linkUrl: string | null }>;
      }
    ).data;
    const notification = rows.find(
      (entry) => entry.body !== null && entry.body.startsWith(CHILD_SHORT_NAME),
    );
    expect(notification).toBeTruthy();
    expect(notification!.title).toBe('Email fix requested');
    // Deliberately still /children: the redesign renamed the WEB route only and
    // left every API contract untouched, so the server keeps emitting the legacy
    // path and the web app serves it as a redirect to /dashboard/school/students.
    expect(notification!.linkUrl).toBe('/dashboard/school/children');
  });

  test('clear: admin corrects the email and both indicators clear', async ({
    page,
    browser,
    baseURL,
  }) => {
    const { row } = await openAdminChildren(page);
    await expect(adminFixBadge(row)).toBeVisible();

    // Edit dialog: row actions -> Edit child -> set the corrected email -> Save.
    await row
      .getByRole('button', {
        name: icu(cat(en, 'SchoolStudents.actions.menuLabel'), { name: CHILD_NAME }),
        exact: true,
      })
      .click();
    await page
      .getByRole('menuitem', { name: cat(en, 'SchoolStudents.actions.edit'), exact: true })
      .click();
    const dialog = page.getByRole('dialog', {
      name: icu(cat(en, 'SchoolStudents.form.editTitle'), { name: CHILD_NAME }),
    });
    await expect(dialog).toBeVisible();
    await dialog.locator('#student-email').fill(FIXED_EMAIL);
    await dialog
      .getByRole('button', { name: cat(en, 'SchoolStudents.form.submitEdit'), exact: true })
      .click();
    await expect(
      page.getByText(icu(cat(en, 'SchoolStudents.form.updatedToast'), { name: CHILD_NAME }), {
        exact: true,
      }),
    ).toBeVisible();
    await expect(dialog).toHaveCount(0);

    // The C-CHD-03 write auto-clears the flag server-side: after a reload the
    // admin badge is gone.
    await page.reload();
    const reloadedScreen = page.locator('[data-surface="school-admin-students"]');
    await expect(reloadedScreen).toBeVisible({ timeout: 20_000 });
    await reloadedScreen.locator('#students-search').fill(CHILD_FAMILY);
    const clearedRow = reloadedScreen.getByRole('row', { name: new RegExp(CHILD_NAME) });
    await expect(clearedRow).toBeVisible();
    await expect(adminFixBadge(clearedRow)).toHaveCount(0);

    // The teacher roster pending state clears from the same server flag: the
    // badge is gone, the corrected email shows, and the row offers the
    // email-fix action again. Separate context (client-persisted session).
    await withRolePage(browser, baseURL, async (teacherPage) => {
      const { row: teacherRow } = await openTeacherRoster(teacherPage);
      await expect(teacherPendingBadge(teacherRow)).toHaveCount(0);
      await expect(teacherRow.getByText(FIXED_EMAIL, { exact: true })).toBeVisible();
      await expect(teacherRow.locator('[data-slot="email-fix-action"]')).toBeVisible();
    });
  });

  test('copy guard: no internal jargon on either surface', async ({
    page,
    browser,
    baseURL,
  }) => {
    // The em dash was dropped from this list by the school admin dashboard
    // redesign: spec sections 1 and 4 make "—" the mandated empty-value glyph
    // ("Level or —", "Avg. reading level ... show — if no data"), so the
    // Students table renders it wherever a student has no class, level or
    // diagnostic yet. The ban was always about internal jargon leaking into
    // user-facing copy, which the remaining terms still cover.
    const banned = ['flag-email-fix', 'notification pipeline', 'email_fix_requested'];

    const { screen: adminScreen } = await openAdminChildren(page);
    const adminText = ((await adminScreen.textContent()) ?? '').toLowerCase();
    for (const term of banned) {
      expect(adminText).not.toContain(term.toLowerCase());
    }

    await withRolePage(browser, baseURL, async (teacherPage) => {
      const { screen: teacherScreen } = await openTeacherRoster(teacherPage);
      const teacherText = ((await teacherScreen.textContent()) ?? '').toLowerCase();
      for (const term of banned) {
        expect(teacherText).not.toContain(term.toLowerCase());
      }
    });
  });
});
