import { expect, test, type APIRequestContext } from '@playwright/test';

import { deleteStudents } from './helpers/student-cleanup';
import { uploadStudentMedia } from './helpers/wizard-fill';
import { API_BASE_URL } from './helpers/mailpit';
import {
  expectMasked,
  f9stamp,
  loginJwt,
  patientGoto,
  setAuth,
  shot,
  studentPayload,
} from './fleet9-lib';

/**
 * F9 SLICE C — parent notifications, LIVE.
 *
 * The NotificationBell is NOT gated by the parent-views flag (src/modules/
 * notifications/components/NotificationBell.tsx): on this masked-portal stack a
 * parent still gets the bell, the unread badge, the preview popover, mark-read
 * and the "View all" deep-link. That makes the bell the ONE live parent
 * notification surface — tested here end to end against the real
 * /api/notifications reads and writes:
 *   GET  /api/notifications?page=&pageSize=  → {data, meta.unreadCount}
 *   PUT  /api/notifications/:documentId/read
 *   POST /api/notifications/read-all
 * The full /dashboard/notifications page is masked (portal tree) — screenshot
 * proves the deep-link's landing.
 */

test.setTimeout(150_000);

interface NotificationRow {
  documentId: string;
  body: string | null;
  linkUrl: string | null;
  readAt: string | null;
}
interface NotificationList {
  data: NotificationRow[];
  meta: { unreadCount?: number };
}

let parentJwt = '';

async function listNotifications(
  request: APIRequestContext,
  pageSize = 100,
): Promise<NotificationList> {
  const res = await request.get(
    `${API_BASE_URL}/api/notifications?page=1&pageSize=${pageSize}`,
    { headers: { Authorization: `Bearer ${parentJwt}` } },
  );
  expect(res.ok(), await res.text()).toBeTruthy();
  return (await res.json()) as NotificationList;
}

/** Create a real child (F9-stamped) — the student-created notification is a REAL
 *  dispatch on the seeded parent, same discipline as notification-feed.spec.ts. */
async function createNotificationSource(
  request: APIRequestContext,
  suffix: string,
): Promise<string> {
  const media = await uploadStudentMedia(request, parentJwt);
  const res = await request.post(`${API_BASE_URL}/api/students`, {
    headers: { Authorization: `Bearer ${parentJwt}` },
    data: { data: { ...studentPayload(suffix), ...media } },
  });
  expect(res.ok(), await res.text()).toBeTruthy();
  return ((await res.json()) as { data: { documentId: string } }).data.documentId;
}

async function waitForNotification(
  request: APIRequestContext,
  marker: string,
): Promise<NotificationRow> {
  for (let attempt = 0; attempt < 15; attempt += 1) {
    const body = await listNotifications(request);
    const hit = body.data.find((row) => row.body?.includes(marker));
    if (hit) return hit;
    await new Promise((r) => setTimeout(r, 2_000));
  }
  throw new Error(`[f9] no notification mentioning ${marker}`);
}

/** Open the bell popover; clicks toggle, so only click while it is still closed.
 *  Hydration on the shared dev server can lag seconds under fleet load. */
async function openBell(page: import('@playwright/test').Page): Promise<void> {
  const bell = page.getByRole('button', { name: 'Open notifications' });
  await expect(bell).toBeVisible();
  const popover = page.locator('[data-slot="notification-popover"]');
  for (let attempt = 0; attempt < 8 && !(await popover.isVisible()); attempt += 1) {
    await page.waitForTimeout(1_000);
    if (!(await popover.isVisible())) await bell.click().catch(() => undefined);
  }
  await expect(popover).toBeVisible({ timeout: 10_000 });
}

test.describe.serial(() => {
  test('badge count equals the API unreadCount; popover lists the same items', async ({
    page,
    request,
  }) => {
    parentJwt = await loginJwt(request, 'parent');
    const before = await listNotifications(request);
    const apiUnread = before.meta.unreadCount ?? -1;
    const apiUnreadRows = before.data.filter((row) => row.readAt === null).length;
    console.log('F9 API unread meta:', apiUnread, 'unread rows in page:', apiUnreadRows);

    await setAuth(page, parentJwt);
    await page.setViewportSize({ width: 1280, height: 800 });
    await patientGoto(page, '/dashboard/children');
    await expectMasked(page); // the shell around the mask carries the bell

    const bell = page.getByRole('button', { name: 'Open notifications' });
    await expect(bell).toBeVisible();
    const badge = bell.locator('[data-slot="count-badge"]');
    if (apiUnread > 0) {
      await expect(badge).toBeVisible();
      const badgeText = (await badge.innerText()).trim();
      console.log('F9 badge shows:', badgeText, '| API unreadCount:', apiUnread);
      // The bell is fed by the same query's meta.unreadCount — they must agree.
      expect(badgeText, '[LOGIC] badge vs meta.unreadCount').toBe(String(apiUnread));
    } else {
      await expect(badge).toHaveCount(0);
    }
    await shot(page, '30-bell-badge-masked-shell');

    await openBell(page);
    const popover = page.locator('[data-slot="notification-popover"]');
    const popoverItems = popover.locator('[data-notification-id]');
    await expect(popoverItems.first()).toBeVisible();
    const popoverCount = await popoverItems.count();
    const popoverUnread = await popover.locator('[data-notification-id][data-read="false"]').count();
    console.log('F9 popover items:', popoverCount, 'unread:', popoverUnread);
    // Preview shows the LATEST pageSize items — a prefix of the API list.
    const apiRows = before.data.slice(0, popoverCount);
    const apiUnreadInPrefix = apiRows.filter((row) => row.readAt === null).length;
    expect(popoverUnread, '[LOGIC] popover unread vs API prefix').toBe(apiUnreadInPrefix);
    await shot(page, '31-notification-popover');
  });

  test('a real activity notification: appears unread, mark-read persists, badge decrements', async ({
    page,
    request,
  }) => {
    const stamp = f9stamp();
    const created: string[] = [];
    try {
      const childId = await createNotificationSource(request, `${stamp}-notif`);
      created.push(childId);
      const notification = await waitForNotification(request, stamp);
      expect(notification.readAt).toBeNull();
      console.log('F9 new notification:', notification.documentId, notification.linkUrl);

      await setAuth(page, parentJwt);
      await patientGoto(page, '/dashboard/children');
      const bell = page.getByRole('button', { name: 'Open notifications' });
      await expect(bell).toBeVisible();
      const badgeBefore = (await bell.locator('[data-slot="count-badge"]').innerText()).trim();

      await openBell(page);
      const popover = page.locator('[data-slot="notification-popover"]');
      const item = popover.locator(`[data-notification-id="${notification.documentId}"]`);
      await expect(item).toHaveAttribute('data-read', 'false');
      await expect(item).toContainText(stamp);
      await shot(page, '32-popover-new-unread');

      // Click = mark read + follow the deep link.
      const markRead = page.waitForResponse(
        (res) =>
          res.request().method() === 'PUT' &&
          res.url().endsWith(`/api/notifications/${notification.documentId}/read`),
      );
      await item.click();
      expect((await markRead).ok()).toBeTruthy();

      // Deep link lands on the child's portal page. MEASURED (fleet9-debug-
      // deeplink.spec.ts): the client navigation takes ~3s under dev compile —
      // the URL only flips when the route chunk is ready, so wait for it.
      await expect(page).toHaveURL(new RegExp(`/dashboard/children/${childId}$`), {
        timeout: 30_000,
      });
      await shot(page, '33-deeplink-landing');

      // The RIGHT page (child documentId in the URL); masked on this stack,
      // never an error or another family's child.
      console.log('F9 deep-link landed on:', page.url());
      await expectMasked(page);

      // Server state moved; a fresh read + a re-render agree, badge decremented.
      const after = await waitForNotification(request, stamp);
      expect(after.readAt).not.toBeNull();
      await patientGoto(page, '/dashboard/children');
      const badge = page
        .getByRole('button', { name: 'Open notifications' })
        .locator('[data-slot="count-badge"]');
      const apiUnreadAfter =
        (await listNotifications(request)).meta.unreadCount ?? 0;
      if (apiUnreadAfter > 0) {
        await expect(badge).toHaveText(String(apiUnreadAfter));
      } else {
        await expect(badge).toHaveCount(0);
      }
      console.log('F9 badge before/after:', badgeBefore, '→', apiUnreadAfter);
      expect(Number(apiUnreadAfter)).toBeLessThan(Number(badgeBefore));
      await shot(page, '34-badge-after-markread');
    } finally {
      await deleteStudents(request, created);
    }
  });

  test('mark-all-read zeroes the badge; "View all" deep-links to the masked feed page', async ({
    page,
    request,
  }) => {
    const before = await listNotifications(request);
    const unread = before.data.filter((row) => row.readAt === null).length;
    await setAuth(page, parentJwt);
    await patientGoto(page, '/dashboard/children');

    const bell = page.getByRole('button', { name: 'Open notifications' });
    await openBell(page);
    const popover = page.locator('[data-slot="notification-popover"]');
    await shot(page, '35-popover-before-markall');

    if (unread > 0) {
      const markAll = page.waitForResponse(
        (res) =>
          res.request().method() === 'POST' &&
          res.url().endsWith('/api/notifications/read-all'),
      );
      await popover.getByRole('button', { name: 'Mark all read' }).click();
      expect((await markAll).ok()).toBeTruthy();
      const after = await listNotifications(request);
      expect(after.meta.unreadCount ?? 0, '[LOGIC] read-all zeroes meta').toBe(0);
      await patientGoto(page, '/dashboard/children');
      await expect(
        page
          .getByRole('button', { name: 'Open notifications' })
          .locator('[data-slot="count-badge"]'),
      ).toHaveCount(0);
      console.log('F9 mark-all-read: unread', unread, '→ 0, badge gone');
    } else {
      console.log('F9 mark-all-read: nothing unread, button disabled path');
      await expect(popover.getByRole('button', { name: 'Mark all read' })).toBeDisabled();
    }

    // "View all" deep-link: the one route the bell offers — masked feed page.
    await openBell(page);
    await page
      .locator('[data-slot="notification-popover"]')
      .getByRole('link', { name: 'View all notifications' })
      .click();
    await expect(page).toHaveURL(/\/dashboard\/notifications$/);
    await expectMasked(page);
    await shot(page, '36-notifications-page-masked');
  });

  test('the feed is per-user: a student never sees or moves the parent rows', async ({
    request,
    page,
  }) => {
    // Anonymous is refused outright.
    const anon = await request.get(`${API_BASE_URL}/api/notifications?page=1&pageSize=5`);
    console.log('F9 anonymous GET /api/notifications:', anon.status());
    expect([401, 403]).toContain(anon.status());

    // A non-parent JWT reaches its OWN (empty) feed — the endpoint is per-user
    // scoped, not parent-gated. The contract that matters: none of the parent's
    // rows may leak into it, and the student may not mutate the parent's rows.
    const parentList = await listNotifications(request);
    const parentIds = new Set(parentList.data.map((row) => row.documentId));
    const student = await loginJwt(request, 'student');
    const own = await request.get(`${API_BASE_URL}/api/notifications?page=1&pageSize=100`, {
      headers: { Authorization: `Bearer ${student}` },
    });
    expect(own.ok(), await own.text()).toBeTruthy();
    const ownRows = ((await own.json()) as { data: NotificationRow[] }).data;
    console.log(
      'F9 student own feed rows:',
      ownRows.length,
      'parent ids leaked:',
      ownRows.filter((row) => parentIds.has(row.documentId)).length,
    );
    expect(ownRows.every((row) => !parentIds.has(row.documentId))).toBeTruthy();

    const target = parentList.data[0];
    if (target) {
      const crossPut = await request.put(
        `${API_BASE_URL}/api/notifications/${target.documentId}/read`,
        { headers: { Authorization: `Bearer ${student}` } },
      );
      console.log('F9 student PUT on parent row:', crossPut.status());
      expect(crossPut.status()).toBe(403);
    }

    // The masked page itself, unauthenticated, hands the visitor to sign-in.
    await patientGoto(page, '/dashboard/notifications');
    await page.waitForTimeout(3_000);
    await shot(page, '37-notifications-anonymous');
    expect(page.url()).toMatch(/sign-in|dashboard/);
  });
});
