import { expect, test } from '@playwright/test';

import { apiEnv, runSql } from './helpers/auth-db';
import { opsJwt } from './helpers/ops-onboarding';

/**
 * C-WEB-04 — POST /api/revalidate publishes IMMEDIATELY, proven live and both
 * ways (task 0e17434e).
 *
 * `tests/unit/revalidate-route-immediacy.test.ts` pins the MECHANISM (our
 * `revalidateTag(tag, { expire: 0 })` call plus the upstream branch it relies
 * on). This spec pins the OUTCOME that mechanism exists for: the API's
 * C-OPSY-01 cache-clear and C-OPSY-02 sitemap-regenerate ops POST this exact
 * route with the shared secret, and the change has to be visible on the next
 * request rather than after the read helper's 300s window.
 *
 * THERE ARE TWO CACHES IN FRONT OF THE PUBLIC BANNER, and the test design turns
 * on that — measured while building this spec, after a first draft proved
 * nothing:
 *   1. the API caches its own `platform-settings` read. Writing the row in
 *      postgres does NOT change what `GET /api/platform-settings/public`
 *      serves, so a psql-driven test can never see any web-side invalidation
 *      work — the input never changed. (Verified: DB row `true|Probe…` while
 *      the API still served `announcement_enabled=false`.)
 *   2. the web caches that API read under the `platform-settings` tag with
 *      `revalidate: 300` (`getPublicSettings`), and THAT is the cache this
 *      route exists to clear.
 * So the change goes in through the API's OWN write path (which clears cache 1)
 * and the assertions then isolate cache 2.
 *
 * THE DISCRIMINATOR is step 3: the public page must still be STALE after the
 * API is already serving the new value. Without it, "the banner is there after
 * revalidating" would prove nothing about the route.
 *
 * NET-ZERO: the announcement is restored through the same API path and
 * `afterAll` re-checks postgres. The two API writes each leave one
 * `settings.announcement` audit row (disclosed).
 */
const API_BASE_URL =
  process.env.E2E_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:5500';

const STORED =
  "select announcement_enabled || '|' || coalesce(announcement_message, '<null>') || '|' || coalesce(announcement_level, 'info') from platform_settings order by id limit 1;";

interface Announcement {
  enabled: boolean;
  message: string | null;
  level: string;
}

function storedAnnouncement(): Announcement {
  const [enabled, message, level] = runSql(STORED).split('|');
  return { enabled: enabled === 't', message: message === '<null>' ? null : message, level };
}

test.describe('C-WEB-04 /api/revalidate immediacy (task 0e17434e)', () => {
  test.describe.configure({ mode: 'serial', timeout: 180_000 });

  const before = storedAnnouncement();
  const throwaway = `Revalidate route proof ${String(Date.now()).slice(-6)}`;

  /** The API's own write path — the only way to change what the API serves. */
  async function putAnnouncement(
    request: import('@playwright/test').APIRequestContext,
    body: Announcement,
  ): Promise<void> {
    const res = await request.put(`${API_BASE_URL}/api/ops/settings/announcement`, {
      headers: {
        Authorization: `Bearer ${await opsJwt()}`,
        'Content-Type': 'application/json',
        'X-Ops-Portal-Version': '1',
      },
      data: { enabled: body.enabled, message: body.message, level: body.level },
    });
    expect(res.status(), await res.text()).toBe(200);
  }

  test.afterAll(() => {
    const now = storedAnnouncement();
    expect(
      `${now.enabled}|${now.message}|${now.level}`,
      'the announcement row must end this file exactly as it started',
    ).toBe(`${before.enabled}|${before.message}|${before.level}`);
  });

  test('a change the API already serves reaches the public page only when the route is called', async ({
    page,
    request,
  }) => {
    const secret = apiEnv('REVALIDATE_SECRET');
    const banner = page.locator('[data-slot="announcement-banner"]');

    // 1. warm the web's tagged read of the API
    await page.goto('/eald');
    const bannerBefore = await banner.count();

    // 2. change it through the API (clears the API's own cache, not the web's)
    await putAnnouncement(request, { enabled: true, message: throwaway, level: 'info' });
    const apiRead = await request.get(`${API_BASE_URL}/api/platform-settings/public`);
    expect(apiRead.status()).toBe(200);
    expect((await apiRead.json()).data.announcement_message).toBe(throwaway);

    // 3. THE DISCRIMINATOR: the web is still serving its cached copy. Asserted
    // on the MESSAGE, not the banner count — when the baseline already has an
    // announcement on, the count is 1 either way and would pass vacuously.
    await page.goto('/eald');
    expect(
      await page.locator('body').innerText(),
      'the web must still be stale here — otherwise this test proves nothing about the route',
    ).not.toContain(throwaway);
    expect(await banner.count()).toBe(bannerBefore);

    // 4. the route publishes it — on the very NEXT request, no sleep, no retry
    const revalidated = await request.post('/api/revalidate', {
      headers: { 'x-revalidate-secret': secret, 'Content-Type': 'application/json' },
      data: { tags: ['platform-settings'] },
    });
    expect(revalidated.status()).toBe(200);
    expect(await revalidated.json()).toEqual({ revalidated: true, tags: ['platform-settings'] });

    await page.goto('/eald');
    await expect(banner).toBeVisible({ timeout: 30_000 });
    await expect(banner).toContainText(throwaway);

    // 5. and the other way round: restore, revalidate, gone on the next request
    await putAnnouncement(request, before);
    const revalidatedBack = await request.post('/api/revalidate', {
      headers: { 'x-revalidate-secret': secret, 'Content-Type': 'application/json' },
      data: { tags: ['platform-settings'] },
    });
    expect(revalidatedBack.status()).toBe(200);

    await page.goto('/eald');
    await expect(banner).toHaveCount(bannerBefore);
    expect(await page.locator('body').innerText()).not.toContain(throwaway);
  });

  test('the secret still gates the route, and an unknown tag is still refused', async ({
    request,
  }) => {
    // The constant-time comparison is untouched by this slice; these are the
    // contract cases proving it still fails closed.
    const wrong = await request.post('/api/revalidate', {
      headers: { 'x-revalidate-secret': 'not-the-secret', 'Content-Type': 'application/json' },
      data: { tags: ['platform-settings'] },
    });
    expect(wrong.status()).toBe(401);

    const missing = await request.post('/api/revalidate', {
      headers: { 'Content-Type': 'application/json' },
      data: { tags: ['platform-settings'] },
    });
    expect(missing.status()).toBe(401);

    const unknownTag = await request.post('/api/revalidate', {
      headers: {
        'x-revalidate-secret': apiEnv('REVALIDATE_SECRET'),
        'Content-Type': 'application/json',
      },
      data: { tags: ['not-a-known-tag'] },
    });
    expect(unknownTag.status()).toBe(400);
  });
});
