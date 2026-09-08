/**
 * Ledger 9 — the ops Flags console end to end against the REAL stack.
 *
 * C-OPSF-01/02 (the registry and its per-key toggle) and C-OPSF-03/04/05 (the
 * maintenance, announcement and rate-limit editors) are all exercised against
 * the running Strapi. No mocks, no stubbed routes.
 *
 * WHICH FLAG THE TOGGLE ROUND-TRIP USES, AND WHY — disclosed because "pick the
 * least-consequential key" deserves evidence rather than a hunch. All three
 * registered flags were grepped in BOTH repos before choosing:
 *   parent_views_enabled     — 0 consumers in schooltest-api, 0 in schooltest-web
 *   maintenance_banner       — 0 consumers in schooltest-api, 0 in schooltest-web
 *   ops_destructive_actions  — 0 consumers in schooltest-api, 0 in schooltest-web
 * `feature_flags` is stored and validated but never gates behaviour, so every
 * flag is currently an inert control surface. `parent_views_enabled` is used
 * here because it is the one whose real gate is documented as living elsewhere:
 * the web reads NEXT_PUBLIC_PARENT_VIEWS_ENABLED at BUILD time
 * (modules/flags/lib/flags.ts), which ledger 9c says stays build-time — so this
 * flag cannot affect the running app even in principle. The test still restores
 * it, so the row is unchanged either way.
 *
 * WHAT IS DELIBERATELY NOT DONE: maintenance mode is never actually enabled.
 * Turning it on closes the public site, and a test that closes the site to
 * prove a switch works has done more damage than the switch it verified. Its
 * confirm gate is proven by OPENING the dialog and cancelling, which is exactly
 * the behaviour the slice promises.
 *
 * THE TWO REAL SAVES ARE IDEMPOTENT ON PURPOSE. The rate-limit editor is saved
 * with the values already stored (20 attempts / 60000 ms — read off the live
 * settings first), and the announcement is saved in its existing off state.
 * Both are genuine 200s through the real routes that change nothing: notably
 * the rate limit governs POST /api/auth/local, which every suite's sign-in
 * depends on, so writing a different value here would sabotage the whole suite.
 *
 * ONE sign-in for the whole file: the API allows 20 POST /api/auth/local per
 * minute per IP and that budget is shared with every other suite on this host.
 */
import { execFileSync } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import { expect, test, type Browser, type BrowserContext, type Page } from '@playwright/test';

import { loadMessages } from './helpers/i18n';
import { loginAs } from './helpers/roles';

const en = loadMessages('en');
const OUT = path.resolve(
  __dirname,
  '../../../.codephant/missions/msn-0da39441-f845-426b-88a1-037c9eb98442/captures',
);
const PG = 'schooltest-api-st1-postgres';
const WAIT = 30_000;

/** The flag proven inert above. Restored in afterAll regardless of outcome. */
const TOGGLE_KEY = 'parent_views_enabled';

function sql(statement: string): string {
  return execFileSync(
    'docker',
    ['exec', PG, 'psql', '-U', 'schooltest', '-d', 'schooltest', '-t', '-A', '-c', statement],
    { encoding: 'utf-8' },
  ).trim();
}

/** The stored flag map, read from the source of truth rather than the UI. */
function storedFlags(): Record<string, boolean> {
  const raw = sql('select feature_flags from platform_settings order by id limit 1;');
  return JSON.parse(raw || '{}') as Record<string, boolean>;
}


/** The stored announcement triplet, read from the source of truth. */
function storedAnnouncement(): { enabled: string; level: string; message: string } {
  const raw = sql(
    'select announcement_enabled, announcement_level, coalesce(announcement_message, \'\') from platform_settings order by id limit 1;',
  );
  const [enabled, level, ...rest] = raw.split('|');
  return { enabled, level, message: rest.join('|') };
}


/**
 * Saves the announcement editor through its confirm gate, waiting on the two
 * DETERMINISTIC network events the transport test already relies on: the
 * `Next-Action` POST (proof the server action ran) and the settings refetch the
 * mutation only issues in its onSuccess path. The success toast is deliberately
 * NOT the signal — sonner auto-dismisses it and it made an earlier revision of
 * the sibling test flaky.
 */
async function saveAnnouncementEditor(page: Page): Promise<void> {
  const editor = page.locator('[data-slot="ops-banner-editor-announcement"]');
  const actionPost = page.waitForRequest(
    (request) => request.method() === 'POST' && Boolean(request.headers()['next-action']),
  );
  const refetch = page.waitForRequest(
    (request) => request.method() === 'GET' && request.url().includes('/api/platform-settings'),
  );
  // The button is disabled while the settings read is in flight (it is
  // `staleTime: 0` + `refetchOnMount: 'always'`, so a refetch triggered by the
  // preceding test can still be running when this one clicks). Waiting for it
  // to be enabled is what makes this helper deterministic — a click on the
  // disabled button silently does nothing and the confirm never opens.
  const saveButton = editor.locator('[data-slot="ops-banner-save-announcement"]');
  await expect(saveButton).toBeEnabled({ timeout: WAIT });
  await saveButton.click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toBeVisible({ timeout: WAIT });
  await dialog
    .getByRole('button', { name: en['Ops.flags.announcement.confirmAction'], exact: true })
    .click();
  await actionPost;
  await refetch;
  await expect(dialog).toBeHidden({ timeout: WAIT });
}

const flagRow = (page: Page, key: string) =>
  page.locator(`[data-slot="ops-flag-row"][data-flag-key="${key}"]`);

test.describe('ledger 9 — the ops Flags console', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });

  let context: BrowserContext;
  let page: Page;
  let originalFlag = false;
  let originalAnnouncement = { enabled: 'f', level: 'info', message: '' };

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    originalFlag = Boolean(storedFlags()[TOGGLE_KEY]);
    originalAnnouncement = storedAnnouncement();
    context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    page = await context.newPage();
    await loginAs(page, 'ops');

    // WARM THE ROUTE HERE, not inside a test. The first navigation to this
    // console compiles it in the dev server, which on a cold cache took ~30s
    // and intermittently blew a per-test 30s budget (observed: two failures in
    // eleven runs, both on runs whose wall time was 36-43s). Paying it once in
    // `beforeAll` puts the cost under the describe block's 120s budget and
    // leaves every test asserting against an already-compiled route.
    await page.goto('/dashboard/ops/flags');
    await expect(flagRow(page, TOGGLE_KEY)).toBeVisible({ timeout: 90_000 });
  });

  test.afterAll(async () => {
    // Restore through the datastore, so a failed run cannot leave the flag flipped.
    const flags = storedFlags();
    if (Boolean(flags[TOGGLE_KEY]) !== originalFlag) {
      flags[TOGGLE_KEY] = originalFlag;
      sql(
        `update platform_settings set feature_flags = '${JSON.stringify(flags)}'::jsonb where id = (select id from platform_settings order by id limit 1);`,
      );
    }
    // The announcement row must survive this file untouched: the both-ways
    // cache-bust test restores it through the UI, and this is the independent
    // check on the source of truth.
    test.expect(storedAnnouncement()).toEqual(originalAnnouncement);
    await context?.close();
  });

  test('the registry renders the live server list with real descriptions', async () => {
    await page.goto('/dashboard/ops/flags');
    await expect(page.getByRole('heading', { name: en['Ops.flags.title'], level: 1 })).toBeVisible({
      timeout: WAIT,
    });

    // The rows come from the server's closed registry, so asserting the real
    // keys proves it is that registry and not a placeholder list.
    await expect(flagRow(page, TOGGLE_KEY)).toBeVisible({ timeout: WAIT });
    await expect(flagRow(page, 'maintenance_banner')).toBeVisible();
    await expect(flagRow(page, 'ops_destructive_actions')).toBeVisible();
    await expect(flagRow(page, 'ops_destructive_actions')).toContainText('irreversible ops actions');
  });

  test('the per-key toggle round-trips through the real route and the datastore', async () => {
    await page.goto('/dashboard/ops/flags');
    const row = flagRow(page, TOGGLE_KEY);
    await expect(row).toBeVisible({ timeout: WAIT });

    const before = Boolean(storedFlags()[TOGGLE_KEY]);
    // Explicit budget, not the 5s default: the registry read has staleTime 0, so
    // TanStack paints the cached row first and reconciles when the refetch
    // lands. Under a cold dev-server compile that gap exceeded 5s and made this
    // assertion flaky — the claim is eventual agreement with the datastore, so
    // it gets a budget that matches.
    await expect(row).toHaveAttribute('data-flag-enabled', before ? 'true' : 'false', {
      timeout: WAIT,
    });

    // Flip it, and watch the PUT carry the TARGET value explicitly.
    const put = page.waitForRequest(
      (request) =>
        request.method() === 'PUT' && request.url().includes(`/api/ops/flags/${TOGGLE_KEY}`),
    );
    await row.locator('[data-slot="ops-flag-switch"]').click();
    const posted = await put;
    expect(JSON.parse(posted.postData() ?? '{}'), 'the toggle sent its target value').toEqual({
      enabled: !before,
    });

    // The datastore is the proof, not the switch's own optimism.
    await expect
      .poll(() => Boolean(storedFlags()[TOGGLE_KEY]), { timeout: WAIT })
      .toBe(!before);
    // And the re-fetched registry agrees.
    await expect(row).toHaveAttribute('data-flag-enabled', (!before).toString(), { timeout: WAIT });

    // Flip it back — the round trip, so the row ends as it began. The switch
    // disables itself while its own row is in flight, so wait for it to be
    // enabled again: clicking a disabled control is a silent no-op, and the
    // restore would never happen.
    const restore = row.locator('[data-slot="ops-flag-switch"]');
    await expect(restore).toBeEnabled({ timeout: WAIT });
    await restore.click();
    await expect.poll(() => Boolean(storedFlags()[TOGGLE_KEY]), { timeout: WAIT }).toBe(before);
  });

  test('an announcement turned on with no message validates inline and sends nothing', async () => {
    await page.goto('/dashboard/ops/flags');
    const editor = page.locator('[data-slot="ops-banner-editor-announcement"]');
    await expect(editor).toBeVisible({ timeout: WAIT });

    const writes: string[] = [];
    const watch = (request: { url: () => string; method: () => string }) => {
      if (request.method() === 'PUT' && request.url().includes('/api/ops/settings/')) {
        writes.push(request.url());
      }
    };
    page.on('request', watch);

    // Empty message + switch ON is the one combination that would publish a
    // blank bar to every visitor.
    await editor.locator('#announcement-message').fill('');
    await editor.locator('[data-slot="ops-banner-switch-announcement"]').click();
    await editor.locator('[data-slot="ops-banner-save-announcement"]').click();

    await expect(editor.getByText(en['Ops.flags.validation.messageRequiredWhenOn'])).toBeVisible();
    // The confirm dialog must NOT open: an invalid form never gets as far as asking.
    await expect(page.getByRole('alertdialog')).toBeHidden();

    page.off('request', watch);
    expect(writes, 'no settings write left the browser for an invalid form').toEqual([]);

    // Put the switch back so the next test starts from the stored state.
    await editor.locator('[data-slot="ops-banner-switch-announcement"]').click();
  });

  test('maintenance mode is confirm-gated, and cancelling writes nothing', async () => {
    await page.goto('/dashboard/ops/flags');
    const editor = page.locator('[data-slot="ops-banner-editor-maintenance"]');
    await expect(editor).toBeVisible({ timeout: WAIT });

    const writes: string[] = [];
    const watch = (request: { url: () => string; method: () => string }) => {
      if (request.method() === 'PUT' && request.url().includes('/api/ops/settings/maintenance')) {
        writes.push(request.url());
      }
    };
    page.on('request', watch);

    // A valid OFF->OFF save is enough to reach the gate without ever asking to
    // close the site.
    await editor.locator('[data-slot="ops-banner-save-maintenance"]').click();
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();
    // The dialog states the consequence rather than asking "are you sure?".
    await expect(dialog).toContainText(en['Ops.flags.maintenance.confirmOff']);

    await dialog.getByRole('button', { name: en['Ops.flags.actions.cancel'], exact: true }).click();
    await expect(dialog).toBeHidden();

    page.off('request', watch);
    expect(writes, 'cancelling the confirm sent no write').toEqual([]);
  });

  test('the rate-limit editor enforces the server bounds before it sends', async () => {
    await page.goto('/dashboard/ops/flags');
    const editor = page.locator('[data-slot="ops-rate-limit-editor"]');
    await expect(editor).toBeVisible({ timeout: WAIT });

    const writes: string[] = [];
    const watch = (request: { url: () => string; method: () => string }) => {
      if (request.method() === 'PUT' && request.url().includes('/api/ops/settings/rate-limit')) {
        writes.push(request.url());
      }
    };
    page.on('request', watch);

    // 0 attempts and a 999 ms window are both outside the controller's bounds.
    await editor.locator('#rate-limit-max').fill('0');
    await editor.locator('#rate-limit-window').fill('999');
    await editor.locator('[data-slot="ops-rate-limit-save"]').click();

    await expect(editor.getByText(en['Ops.flags.validation.maxBounds'].replace('{min}', '1').replace('{max}', '1000'))).toBeVisible();
    await expect(page.getByRole('alertdialog')).toBeHidden();

    page.off('request', watch);
    expect(writes, 'an out-of-bounds form sent no write').toEqual([]);
  });

  test('a real idempotent save round-trips through confirm to the server', async () => {
    // The values already stored, so this is a genuine 200 that changes nothing.
    const stored = sql(
      'select rate_limit_auth_max, rate_limit_auth_window_ms from platform_settings order by id limit 1;',
    ).split('|');
    const storedMax = stored[0];
    const storedWindow = stored[1];

    await page.goto('/dashboard/ops/flags');
    const editor = page.locator('[data-slot="ops-rate-limit-editor"]');
    await expect(editor).toBeVisible({ timeout: WAIT });

    await editor.locator('#rate-limit-max').fill(storedMax);
    await editor.locator('#rate-limit-window').fill(storedWindow);

    const put = page.waitForRequest(
      (request) =>
        request.method() === 'PUT' && request.url().includes('/api/ops/settings/rate-limit'),
    );
    await editor.locator('[data-slot="ops-rate-limit-save"]').click();
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();
    await dialog
      .getByRole('button', { name: en['Ops.flags.rateLimit.confirmAction'], exact: true })
      .click();

    const posted = await put;
    expect(JSON.parse(posted.postData() ?? '{}'), 'the save sent snake_case window_ms').toEqual({
      max: Number(storedMax),
      window_ms: Number(storedWindow),
    });

    // The stored values are unchanged, which is the point of an idempotent save.
    await expect
      .poll(
        () =>
          sql(
            'select rate_limit_auth_max, rate_limit_auth_window_ms from platform_settings order by id limit 1;',
          ),
        { timeout: WAIT },
      )
      .toBe(`${storedMax}|${storedWindow}`);
  });

  test('the announcement save runs SERVER-side, so no browser request hits the route', async () => {
    await page.goto('/dashboard/ops/flags');
    const editor = page.locator('[data-slot="ops-banner-editor-announcement"]');
    await expect(editor).toBeVisible({ timeout: WAIT });

    // This is the transport assertion for the server action: the announcement
    // PUT is issued by the NEXT SERVER (so it can invalidate the cache tag,
    // which a browser cannot do without the shared secret). If the save were
    // ever refactored back into the browser, this expectation fails.
    const direct: string[] = [];
    const watch = (request: { url: () => string; method: () => string }) => {
      if (request.method() === 'PUT' && request.url().includes('/api/ops/settings/announcement')) {
        direct.push(request.url());
      }
    };
    page.on('request', watch);

    // A Next server action posts back to the page URL carrying `Next-Action`.
    // Watching for THAT is what proves the save executed server-side, and it is
    // a deterministic network event — unlike the success toast, which sonner
    // auto-dismisses and which made an earlier revision of this test flaky
    // (1 failure in 4 runs, "element(s) not found" on the toast text).
    const actionPost = page.waitForRequest(
      (request) => request.method() === 'POST' && Boolean(request.headers()['next-action']),
    );
    // The mutation invalidates the settings cache ONLY in its onSuccess path, so
    // the refetch that follows is a deterministic signal that the write really
    // succeeded rather than surfacing an error toast.
    const refetch = page.waitForRequest(
      (request) => request.method() === 'GET' && request.url().includes('/api/platform-settings'),
    );

    // Saving the existing OFF state: valid (no message needed when off) and
    // idempotent, but a real write through the real route.
    await editor.locator('[data-slot="ops-banner-save-announcement"]').click();
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();
    await dialog
      .getByRole('button', { name: en['Ops.flags.announcement.confirmAction'], exact: true })
      .click();

    await actionPost;
    await refetch;
    // The dialog closes on the resolved save.
    await expect(dialog).toBeHidden({ timeout: WAIT });

    page.off('request', watch);
    expect(direct, 'the browser never called the Strapi announcement route directly').toEqual([]);
  });

  test('the announcement reaches the PUBLIC banner immediately, both ways (updateTag, not SWR)', async () => {
    // THE DEFECT THIS PINS. The save action used `revalidateTag(tag, 'max')`,
    // which is STALE-WHILE-REVALIDATE: Next only marks the path revalidated
    // when the profile's expire is 0, so the public pages under the
    // `platform-settings` tag (getPublicSettings caches the C-SET-01 read with
    // `revalidate: 300`) kept serving the PRE-EDIT banner while a background
    // refresh ran. `updateTag` is the action-context immediate purge.
    //
    // WHY BOTH WAYS IS THE PROOF, not one save: with SWR the first save can
    // still look right (the background refresh lands before the assertion) and
    // the SECOND read serves the now-stale-again cache. Turning the banner ON
    // and then OFF, asserting the public page each time with NO sleep, is what
    // discriminates the two primitives — verified red against
    // `revalidateTag(tag, 'max')` before this passed.
    //
    // NET-ZERO: the row is restored through the SAME UI path, and `afterAll`
    // asserts the datastore is byte-identical to what it held before.
    const before = storedAnnouncement();
    const throwaway = `E2E announcement ${String(Date.now()).slice(-6)} — ledger 9 cache-bust proof`;

    // WAIT FOR HYDRATION BEFORE TYPING, and this is a measured requirement:
    // the editor's form is driven by react-hook-form's `values` prop fed from
    // `useSettingsReadQuery` (staleTime 0, refetchOnMount 'always'), so a
    // refetch that lands AFTER a fill RESETS the field. On a warm route that
    // reset arrived between the fill and the save, leaving enabled=true with an
    // empty message — the form then failed `messageRequiredWhenOn`, the confirm
    // never opened, and the click looked like it did nothing. Awaiting the
    // settings response first makes the form stable before it is touched.
    const settingsRead = page.waitForResponse(
      (response) => response.url().includes('/api/platform-settings') && response.status() === 200,
      { timeout: WAIT },
    );
    await page.goto('/dashboard/ops/flags');
    const editor = page.locator('[data-slot="ops-banner-editor-announcement"]');
    await expect(editor).toBeVisible({ timeout: WAIT });
    await settingsRead;
    await expect(editor.locator('[data-slot="ops-banner-save-announcement"]')).toBeEnabled({
      timeout: WAIT,
    });

    // --- ON: a real message and a real switch, saved through the confirm ---
    await editor.locator('#announcement-message').fill(throwaway);
    await expect(editor.locator('#announcement-message')).toHaveValue(throwaway);
    if (before.enabled !== 't') {
      await editor.locator('[data-slot="ops-banner-switch-announcement"]').click();
    }
    await expect(editor).toHaveAttribute('data-enabled', 'true');
    await saveAnnouncementEditor(page);
    await expect
      .poll(() => storedAnnouncement().enabled, { timeout: WAIT })
      .toBe('t');

    // --- the PUBLIC page must serve it with no waiting ---
    await page.goto('/eald');
    const banner = page.locator('[data-slot="announcement-banner"]');
    await expect(banner).toBeVisible({ timeout: WAIT });
    await expect(banner).toContainText(throwaway);

    await mkdir(OUT, { recursive: true });
    await page.screenshot({ path: path.join(OUT, 'announcement-banner-desktop.png') });
    await test.info().attach('announcement-banner-desktop', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
    await page.setViewportSize({ width: 375, height: 812 });
    await expect(banner).toBeVisible({ timeout: WAIT });
    await page.screenshot({ path: path.join(OUT, 'announcement-banner-375.png') });
    await test.info().attach('announcement-banner-375', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
    await page.setViewportSize({ width: 1440, height: 900 });

    // --- OFF again, the same way; the banner must be gone immediately ---
    const settingsReadBack = page.waitForResponse(
      (response) => response.url().includes('/api/platform-settings') && response.status() === 200,
      { timeout: WAIT },
    );
    await page.goto('/dashboard/ops/flags');
    await expect(editor).toBeVisible({ timeout: WAIT });
    await settingsReadBack;
    // Hydrated from the row this test just wrote — the editor round-trips too.
    await expect(editor).toHaveAttribute('data-enabled', 'true', { timeout: WAIT });
    await expect(editor.locator('#announcement-message')).toHaveValue(throwaway, { timeout: WAIT });
    await editor.locator('#announcement-message').fill(before.message);
    if (before.enabled !== 't') {
      await editor.locator('[data-slot="ops-banner-switch-announcement"]').click();
      await expect(editor).toHaveAttribute('data-enabled', 'false');
    }
    await saveAnnouncementEditor(page);
    await expect
      .poll(() => storedAnnouncement().enabled, { timeout: WAIT })
      .toBe(before.enabled);

    await page.goto('/eald');
    await expect(banner).toHaveCount(0);

    // --- the datastore is back to exactly what it held ---
    expect(storedAnnouncement()).toEqual(before);
  });

  test('captures the console at desktop and 375', async () => {
    await mkdir(OUT, { recursive: true });
    await page.goto('/dashboard/ops/flags');
    await expect(flagRow(page, TOGGLE_KEY)).toBeVisible({ timeout: WAIT });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.screenshot({ path: path.join(OUT, 'flags-console-desktop.png'), fullPage: true });
    await test.info().attach('flags-console-desktop', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });

    const editors = page.locator('[data-slot="ops-flags-editors"]');
    await editors.scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(OUT, 'flags-console-editors.png') });
    await test.info().attach('flags-console-editors', {
      body: await editors.screenshot(),
      contentType: 'image/png',
    });

    await page.setViewportSize({ width: 375, height: 812 });
    await expect(flagRow(page, TOGGLE_KEY)).toBeVisible({ timeout: WAIT });
    await page.screenshot({ path: path.join(OUT, 'flags-console-375.png'), fullPage: true });
    await test.info().attach('flags-console-375', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });

    await page.setViewportSize({ width: 1440, height: 900 });
  });
});
