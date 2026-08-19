import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { loginAsParent } from './helpers/auth';
import { runSql } from './helpers/auth-db';
import { fetchWithRetry, loginCached } from './helpers/http';
import { cat, loadMessages } from './helpers/i18n';

// Task 117 (st-mvp-pivot) live check: the W18 teacher notification flow end to
// end (C-NOT-01, mvp-updates 4.4/4.3). A REAL student_email_fix_requested
// notification is triggered through the C-CHD-05 flag endpoint (teacher, API
// token) on a fixture roster child, then the school_admin reaches the teach
// feed through the bell's view-all, sees the fresh row with its unread
// affordance, marks it read, and follows its link to the children surface.
// View-all routing is repeated as the teacher (same teach feed) and spot-
// checked as the parent (parent feed unchanged). No mocks; teardown deletes
// the notification row (+ link) and clears the student flag so the fixture
// ends exactly as it started.
const en = loadMessages('en');

const API = 'http://127.0.0.1:5500';
const TEACHER = { email: process.env.E2E_TEACHER_EMAIL ?? 'teacher@schooltest.local', password: process.env.E2E_TEACHER_PASSWORD ?? 'Teacher1234!' };
const SCHOOL_ADMIN = { email: 'schooladmin-a@schooltest.local', password: 'pEbjxVnJ4PPYiv8D!A1' };
const CLASS_ID = 'x1hat1dy90boz11n9zyphoan'; // "EAL/D Year 7 - Room 4"
const EMAIL_FIX_TYPE = 'student_email_fix_requested';

interface ChildListRow {
  documentId: string;
  given_name: string | null;
  family_name: string | null;
  status: string | null;
  email_fix_requested: boolean;
}

// The C-NOT-01 feed row (task 112): type/link/read mapped from the stored row.
interface SchoolFeedRow {
  documentId: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

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

// The bell's view-all is a Button-with-href (anchor semantics); the arrow
// glyph is aria-hidden so the accessible name is the catalog string alone.
async function openFeedViaBell(page: Page, feedGlob: string) {
  await page
    .getByRole('button', { name: cat(en, 'Notifications.bellLabel'), exact: true })
    .click();
  await page
    .getByRole('link', { name: cat(en, 'Notifications.viewAll'), exact: true })
    .click();
  // The i18n Link renders the default locale prefix-free ("/dashboard/..."),
  // so the wait glob never carries "/en".
  await page.waitForURL(feedGlob, { timeout: 30_000 });
  const screen = page.locator('[data-surface="teacher-notifications"]');
  await expect(screen).toBeVisible({ timeout: 20_000 });
  return screen;
}

async function fetchSchoolFeed(
  request: APIRequestContext,
  jwt: string,
): Promise<SchoolFeedRow[]> {
  const res = await fetchWithRetry(() =>
    request.get(`${API}/api/schools/me/notifications?pageSize=100`, {
      headers: { Authorization: `Bearer ${jwt}` },
    }),
  );
  expect(res.ok()).toBeTruthy();
  return ((await res.json()) as { data: SchoolFeedRow[] }).data;
}

test.describe('task 117: teacher notification flow vs the live stack', () => {
  // The timeout carries the 429 ride-out budget for batch runs (helpers/http.ts).
  test.describe.configure({ mode: 'serial', timeout: 120_000 });

  let childDocumentId: string;
  let notificationDocumentId: string;
  let notificationTitle: string;

  test.beforeAll(async ({ request }) => {
    // Setup: flag a fixture roster child as the teacher (C-CHD-05), which
    // dispatches a real student_email_fix_requested notification to the
    // school's school_admin through the live pipeline.
    const teacherJwt = await login(request, TEACHER);
    const roster = await fetchWithRetry(() =>
      request.get(`${API}/api/schools/me/children?class=${CLASS_ID}&pageSize=100`, {
        headers: { Authorization: `Bearer ${teacherJwt}` },
      }),
    );
    expect(roster.ok()).toBeTruthy();
    const children = ((await roster.json()) as { data: ChildListRow[] }).data;
    const child = children.find((row) => row.status === 'active' && !row.email_fix_requested);
    expect(child, 'fixture class has an active, unflagged child').toBeTruthy();
    childDocumentId = child!.documentId;

    const adminJwt = await login(request, SCHOOL_ADMIN);
    const beforeIds = new Set(
      (await fetchSchoolFeed(request, adminJwt))
        .filter((row) => row.type === EMAIL_FIX_TYPE)
        .map((row) => row.documentId),
    );

    const flag = await fetchWithRetry(() =>
      request.post(`${API}/api/schools/me/children/${childDocumentId}/flag-email-fix`, {
        headers: { Authorization: `Bearer ${teacherJwt}` },
      }),
    );
    expect(flag.ok()).toBeTruthy();

    // The fresh row is the one the flag added to the admin's own feed; its
    // title is matched from the API response in the UI, never a literal.
    const fresh = (await fetchSchoolFeed(request, adminJwt)).find(
      (row) => row.type === EMAIL_FIX_TYPE && !beforeIds.has(row.documentId),
    );
    expect(fresh, 'flag-email-fix dispatched a school_admin notification').toBeTruthy();
    notificationDocumentId = fresh!.documentId;
    notificationTitle = fresh!.title;
    expect(fresh!.read).toBe(false);
    expect(fresh!.link).toBe('/dashboard/school/children');
  });

  test.afterAll(async () => {
    // Teardown (mission-sanctioned SQL hygiene): drop the notification row +
    // its user link and clear the student flag — the fixture ends with zero
    // flagged students and zero email-fix notifications, and the read state
    // the spec mutated leaves with the deleted row.
    if (notificationDocumentId) {
      runSql(
        `delete from notifications_user_lnk where notification_id in (` +
          `select id from notifications where document_id = '${notificationDocumentId}')`,
      );
      runSql(`delete from notifications where document_id = '${notificationDocumentId}'`);
    }
    if (childDocumentId) {
      runSql(
        `update students set email_fix_requested = false where document_id = '${childDocumentId}'`,
      );
    }
  });

  test('school_admin: bell view-all lands on the teach feed with the fresh notification', async ({
    page,
  }) => {
    await signIn(page, SCHOOL_ADMIN, '**/dashboard/school**');
    const screen = await openFeedViaBell(page, '**/dashboard/teach/notifications');

    const item = screen.locator(`li[data-notification-id="${notificationDocumentId}"]`);
    await expect(item).toBeVisible();
    await expect(item).toContainText(notificationTitle);
    // Unread styling: the row carries data-read=false and offers the mark-read
    // dot; the empty-state copy never renders while rows exist.
    await expect(item).toHaveAttribute('data-read', 'false');
    await expect(
      item.getByRole('button', { name: cat(en, 'Notifications.markRead'), exact: true }),
    ).toBeVisible();
    await expect(
      screen.getByText(cat(en, 'Notifications.teacherFeed.emptyTitle'), { exact: true }),
    ).toHaveCount(0);
  });

  test('school_admin: mark-read clears the unread dot and the link reaches the children surface', async ({
    page,
  }) => {
    await signIn(page, SCHOOL_ADMIN, '**/dashboard/school**');
    await page.goto('/en/dashboard/teach/notifications');
    const screen = page.locator('[data-surface="teacher-notifications"]');
    await expect(screen).toBeVisible({ timeout: 20_000 });

    const item = screen.locator(`li[data-notification-id="${notificationDocumentId}"]`);
    await expect(item).toHaveAttribute('data-read', 'false');
    await item
      .getByRole('button', { name: cat(en, 'Notifications.markRead'), exact: true })
      .click();
    await expect(item).toHaveAttribute('data-read', 'true');
    await expect(
      item.getByRole('button', { name: cat(en, 'Notifications.markRead'), exact: true }),
    ).toHaveCount(0);

    // The C-NOT-01 link deep-links to the surface where the fix happens.
    await item.getByRole('link', { name: notificationTitle, exact: true }).click();
    await page.waitForURL('**/dashboard/school/children', { timeout: 30_000 });
    await expect(page.locator('[data-surface="school-admin-children"]')).toBeVisible({
      timeout: 20_000,
    });
  });

  test('teacher: bell view-all lands on the same teach feed', async ({ page }) => {
    await signIn(page, TEACHER, '**/dashboard/teach**');
    await openFeedViaBell(page, '**/dashboard/teach/notifications');
  });

  test('parent: bell view-all still lands on the parent feed', async ({ page }) => {
    await loginAsParent(page);
    await page
      .getByRole('button', { name: cat(en, 'Notifications.bellLabel'), exact: true })
      .click();
    await page
      .getByRole('link', { name: cat(en, 'Notifications.viewAll'), exact: true })
      .click();
    await page.waitForURL('**/dashboard/notifications', { timeout: 30_000 });
    // Parent bell behaviour is unchanged: the parent feed URL is the target.
    // The parent portal itself is stubbed this release, so the stub copy is
    // what proves the landing (never the teach feed).
    await expect(
      page.getByText(cat(en, 'Auth.parentViewsUnavailable.title'), { exact: true }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('[data-surface="teacher-notifications"]')).toHaveCount(0);
  });
});
