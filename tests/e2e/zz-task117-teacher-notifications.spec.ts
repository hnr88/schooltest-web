import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { HOOK_TIMEOUT_MS } from './helpers/api-named-retry';
import { loginAsParent } from './helpers/auth';
import { fixtureTeacherCredentials, roleCredentials } from './helpers/credentials';
import { runSql } from './helpers/auth-db';
import { fetchWithRetry, loginCached } from './helpers/http';
import { cat, loadMessages } from './helpers/i18n';
import { fixtureClassId } from './helpers/fixture-class';

// Task 117 (st-mvp-pivot) live check: the W18 teacher notification flow end to
// end (C-NOT-01, mvp-updates 4.4/4.3). A REAL student_email_fix_requested
// notification is triggered through the C-CHD-05 flag endpoint (teacher, API
// token) on a fixture roster child, then the school_admin reaches the teach
// feed through the bell's view-all, sees the fresh row with its unread
// affordance, marks it read, and follows its link to the students surface.
// View-all routing is repeated as the teacher (same teach feed) and spot-
// checked as the parent (parent feed unchanged). No mocks; teardown deletes
// the notification row (+ link) and clears the student flag so the fixture
// ends exactly as it started.
const en = loadMessages('en');

const API = 'http://127.0.0.1:5500';
const TEACHER = fixtureTeacherCredentials();
const SCHOOL_ADMIN = roleCredentials('schoolAdmin');
const CLASS_ID = fixtureClassId(); // "EAL/D Year 7 - Room 4"
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
  await page.getByLabel(cat(en, 'Auth.portal.emailLabel'), { exact: true }).fill(credentials.email);
  await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(credentials.password);
  await page.getByRole('button', { name: cat(en, 'Auth.portal.loginButton'), exact: true }).click();
  // Wait for the SETTLED role landing (not the transient /dashboard hop), so a
  // late role redirect can never hijack the goto that follows.
  await page.waitForURL(landingGlob, { timeout: 90_000 });
}

// The bell's view-all is a Button-with-href (anchor semantics); the arrow
// glyph is aria-hidden so the accessible name is the catalog string alone.
async function openFeedViaBell(page: Page, feedGlob: string) {
  await page.getByRole('button', { name: cat(en, 'Notifications.bellLabel'), exact: true }).click();
  await page.getByRole('link', { name: cat(en, 'Notifications.viewAll'), exact: true }).click();
  // The i18n Link renders the default locale prefix-free ("/dashboard/..."),
  // so the wait glob never carries "/en".
  await page.waitForURL(feedGlob, { timeout: 30_000 });
  const screen = page.locator('[data-surface="teacher-notifications"]');
  await expect(screen).toBeVisible({ timeout: 20_000 });
  return screen;
}

async function fetchSchoolFeed(request: APIRequestContext, jwt: string): Promise<SchoolFeedRow[]> {
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
    // ops/12 (1c5104f): the hook budget must EXCEED the retry budget it
    // contains. Playwright's default beforeAll timeout is 30s against a 175s
    // ride-out, so without this an environment fault arrives as an opaque
    // hook hang instead of a named class. First statement, not an options
    // argument — that overload does not exist in Playwright 1.61.1.
    test.setTimeout(HOOK_TIMEOUT_MS);
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
    expect(fresh!.link).toBe('/dashboard/school/students');
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

  test('school_admin: mark-read clears the unread dot and the link reaches the students surface', async ({
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
    await page.waitForURL('**/dashboard/school/students', { timeout: 30_000 });
    await expect(page.locator('[data-surface="school-admin-students"]')).toBeVisible({
      timeout: 20_000,
    });
  });

  test('teacher: bell view-all lands on the same teach feed', async ({ page }) => {
    await signIn(page, TEACHER, '**/dashboard**');
    await openFeedViaBell(page, '**/dashboard/teach/notifications');
  });

  // teacher/30 — THE UNREAD DISTINCTION, ASSERTED DIRECTLY AND BY COUNT.
  //
  // The row's "unread rows stay visually distinct under every filter" bullet is
  // VACUOUS on this surface: the endpoint takes page/pageSize only, so no
  // filter is offered and nothing was asserting the distinction at all. A
  // vacuous pass is worse than a weak one — it does not even try. So the
  // property that bullet exists to protect is pinned here on its own merits,
  // independent of filtering, and it stays pinned if someone later widens the
  // endpoint and adds the filter.
  //
  // COUNTED, three ways that must agree: N unread rows -> N unread tiles -> N
  // mark-read controls. A "some unread row looks unread" check would pass with
  // one row styled correctly and the rest broken.
  test('teacher: unread rows are visually distinct, and every one carries a mark-read control', async ({
    page,
  }) => {
    await signIn(page, TEACHER, '**/dashboard**');
    await openFeedViaBell(page, '**/dashboard/teach/notifications');
    const screen = page.locator('[data-surface="teacher-notifications"]');
    await expect(screen).toBeVisible({ timeout: 20_000 });

    // teacher/30 — WAIT FOR THE PAGE TO SETTLE BEFORE COUNTING. This is the
    // server-mode difference and it cost this test a silent skip on its first
    // live run: the surface becomes visible while the kit is still in its
    // loading arm, so a `count()` taken the instant the surface appears reads 0
    // rows and the guard below then skipped a test that had 20 unread rows to
    // check. A count is only meaningful once at least one row has rendered, so
    // that is asserted with a retrying expectation first.
    const allRows = screen.locator('[data-slot="school-notification-item"]');
    await expect(allRows.first(), 'a feed row renders before anything is counted').toBeVisible({
      timeout: 20_000,
    });

    const unreadRows = screen.locator('[data-slot="school-notification-item"][data-read="false"]');
    const readRows = screen.locator('[data-slot="school-notification-item"][data-read="true"]');
    const unreadCount = await unreadRows.count();

    // The guard SURVIVES, but only for genuine absence — a feed whose visible
    // page really carries no unread row. It is no longer reachable by a race.
    test.skip(
      unreadCount === 0,
      'feed has no unread row on this page — the distinction cannot be exercised',
    );

    // One mark-read control per unread row, counted rather than sampled.
    await expect(
      screen.getByRole('button', { name: cat(en, 'Notifications.markRead'), exact: true }),
    ).toHaveCount(unreadCount);

    // Every unread tile carries the unread weight; no unread row is styled read.
    for (let index = 0; index < unreadCount; index += 1) {
      const tile = unreadRows.nth(index).locator('> span').first();
      await expect(tile, `unread row ${index} carries the unread tile weight`).toHaveClass(
        /bg-foreground/,
      );
    }

    // And a read row, where one exists, carries the READ treatment — the other
    // half of the distinction. Without this the test would pass if every row
    // were styled unread.
    if ((await readRows.count()) > 0) {
      await expect(readRows.first().locator('> span').first()).toHaveClass(/bg-divider/);
    }
  });

  // teacher/30 — THE PAGINATION BOUNDARY DID NOT MOVE. The migration to the
  // generic kit could have silently turned this SERVER-paginated feed into a
  // client-mode single read of 100 rows (ops/36's NotificationFeedList is
  // `mode: 'client'`), which would lose every notification past the hundredth
  // and break paging entirely. D-17 forbids moving the boundary.
  //
  // PAIRED, because a lone "page 1 renders" assertion would pass IDENTICALLY
  // under the regression it is meant to catch: the first assertion pins the
  // server page size at 20, the second proves a SECOND page is actually
  // reachable — which a single 100-row client read could never offer.
  test('teacher: the feed is still SERVER-paginated at 20 per page, and page 2 is reachable', async ({
    page,
    request,
  }) => {
    const token = await login(request, TEACHER);
    // The wire, first: the endpoint still answers with pageSize 20.
    const first = await fetchWithRetry(() =>
      request.get(`${API}/api/schools/me/notifications?page=1&pageSize=20`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
    const firstBody = (await first.json()) as {
      data: SchoolFeedRow[];
      meta: { pagination: { page: number; pageSize: number; pageCount: number; total: number } };
    };
    expect(firstBody.meta.pagination.pageSize, 'the server page size is unchanged').toBe(20);
    expect(firstBody.data.length).toBeLessThanOrEqual(20);

    // THE SENSITIVITY HALF: with more than one page of rows, page 2 must serve
    // a DIFFERENT set. Skipped honestly when the fixture has only one page —
    // an absent second page is not evidence either way.
    test.skip(
      firstBody.meta.pagination.pageCount < 2,
      'fixture feed has a single page — the second-page half cannot be exercised',
    );
    const second = await fetchWithRetry(() =>
      request.get(`${API}/api/schools/me/notifications?page=2&pageSize=20`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
    const secondBody = (await second.json()) as { data: SchoolFeedRow[] };
    expect(secondBody.data.length, 'page 2 serves rows').toBeGreaterThan(0);
    const firstIds = firstBody.data.map((row) => row.documentId);
    expect(
      secondBody.data.every((row) => !firstIds.includes(row.documentId)),
      'page 2 is a different set, not a re-serve of page 1',
    ).toBe(true);

    // And the screen itself offers the kit's pager rather than a bespoke one.
    await signIn(page, TEACHER, '**/dashboard**');
    await openFeedViaBell(page, '**/dashboard/teach/notifications');
    const screen = page.locator('[data-surface="teacher-notifications"]');
    await expect(screen).toBeVisible({ timeout: 20_000 });
    await expect(
      screen.locator('[data-slot="directory-pagination"]'),
      'the kit owns the pager on this surface',
    ).toHaveCount(1);
  });

  test('parent: bell view-all still lands on the parent feed', async ({ page }) => {
    await loginAsParent(page);
    await page
      .getByRole('button', { name: cat(en, 'Notifications.bellLabel'), exact: true })
      .click();
    await page.getByRole('link', { name: cat(en, 'Notifications.viewAll'), exact: true }).click();
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
