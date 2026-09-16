/**
 * fleet4-03 — LIVE sweep of the FLAGS and SYSTEM/BACKUP ops tool endpoints and
 * their observable effects on the real web site.
 *
 * The flags console and system/backup screens retired from the web (R-09…R-14)
 * but their endpoints keep serving (C-OPSF-01..05, C-OPSY-01..10), and the
 * public site RENDERS what they write — that render is the live cross-check
 * proven here with screenshots. Refusals: anonymous and ops_support.
 *
 * Probe data stamped F4-<epoch>; every mutation restores its prior value.
 * NOTE: the rate-limit write happy path is deliberately NOT exercised — the
 * shared per-IP auth limiter is load-bearing for every fleet agent running
 * against this API right now; its validation refusal IS covered.
 */
import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

const CAPTURES = path.resolve(__dirname, 'captures/fleet4');
const API = process.env.E2E_API_BASE_URL ?? 'http://127.0.0.1:5500';
const WEB = process.env.E2E_BASE_URL ?? 'http://localhost:3002';
const STAMP = `F4-${Date.now()}`;
const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET ?? '';

const shot = (page: Page, name: string) =>
  page.screenshot({ path: path.join(CAPTURES, `${name}.png`), fullPage: true });

const jwtCache: Record<string, string> = {};
async function jwtFor(identifier: string, password: string): Promise<string> {
  const key = `${identifier}:${password}`;
  if (jwtCache[key]) return jwtCache[key];
  const res = await fetch(`${API}/api/auth/local`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });
  if (!res.ok) throw new Error(`[f4] login ${identifier} failed: ${res.status}`);
  jwtCache[key] = ((await res.json()) as { jwt: string }).jwt;
  return jwtCache[key];
}
const opsJwt = () => jwtFor('admin@schooltest.local', 'Admin1234!');
const supportJwt = () =>
  jwtFor(
    process.env.E2E_OPS_SUPPORT_EMAIL ?? 'opssupport@schooltest.local',
    process.env.E2E_OPS_SUPPORT_PASSWORD ?? 'SupWvEStNXzqs6rljOl5YOSm!7',
  );
const parentJwt = () =>
  jwtFor(
    process.env.E2E_PARENT_EMAIL ?? 'parent@schooltest.local',
    process.env.E2E_PARENT_PASSWORD ?? 'Parent1234!',
  );

interface Result {
  status: number;
  body: Record<string, unknown> | null;
}

async function call(
  method: 'GET' | 'POST' | 'PUT',
  path: string,
  options: { auth?: string; body?: Record<string, unknown> } = {},
): Promise<Result> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(options.auth ? { Authorization: `Bearer ${options.auth}` } : {}),
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });
  return { status: res.status, body: (await res.json().catch(() => null)) as Result['body'] };
}

const data = (result: Result) => (result.body as { data: Record<string, unknown> } | null)?.data;

async function revalidate(tags: string[]): Promise<void> {
  const res = await fetch(`${WEB}/api/revalidate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-revalidate-secret': REVALIDATE_SECRET },
    body: JSON.stringify({ tags }),
  });
  if (!res.ok) throw new Error(`[f4] revalidate failed: ${res.status}`);
  await fetch(`${WEB}/`).catch(() => undefined);
}

test.describe.configure({ mode: 'serial' });
test.describe.configure({ timeout: 120_000 });

test.describe('fleet4 flags + system', () => {
  // Snapshot of the public-facing knobs, restored UNCONDITIONALLY in afterAll:
  // a test timeout kills a per-test finally, and a maintenance banner left on
  // the public site is the exact incident this surface exists to prevent.
  let snapshot: {
    maintenance_mode: boolean;
    maintenance_message: string | null;
    announcement_enabled: boolean;
    announcement_message: string | null;
    announcement_level: string | null;
    destructiveFlag: boolean;
  } | null = null;

  async function ensureSnapshot(): Promise<void> {
    if (snapshot) return;
    const publicRow = data(await call('GET', '/api/platform-settings/public', {})) as Record<
      string,
      unknown
    >;
    const flags = data(await call('GET', '/api/ops/flags', { auth: await opsJwt() })) as Array<{
      key: string;
      enabled: boolean;
    }>;
    snapshot = {
      maintenance_mode: Boolean(publicRow.maintenance_mode),
      maintenance_message: (publicRow.maintenance_message as string | null) ?? null,
      announcement_enabled: Boolean(publicRow.announcement_enabled),
      announcement_message: (publicRow.announcement_message as string | null) ?? null,
      announcement_level: (publicRow.announcement_level as string | null) ?? null,
      destructiveFlag:
        flags.find((flag) => flag.key === 'ops_destructive_actions')?.enabled ?? false,
    };
  }

  test.afterAll(async () => {
    if (!snapshot) return;
    await call('PUT', '/api/ops/settings/maintenance', {
      auth: await opsJwt(),
      body: {
        enabled: snapshot.maintenance_mode,
        message: snapshot.maintenance_message,
      },
    });
    await call('PUT', '/api/ops/settings/announcement', {
      auth: await opsJwt(),
      body: {
        enabled: snapshot.announcement_enabled,
        message: snapshot.announcement_message,
        ...(snapshot.announcement_level ? { level: snapshot.announcement_level } : {}),
      },
    });
    await call('PUT', '/api/ops/flags/ops_destructive_actions', {
      auth: await opsJwt(),
      body: { enabled: snapshot.destructiveFlag },
    });
    await revalidate(['platform-settings']);
  });

  test.beforeAll(() => {
    mkdirSync(CAPTURES, { recursive: true });
  });

  test('flags list: the three real flags, readable as ops', async () => {
    const result = await call('GET', '/api/ops/flags', { auth: await opsJwt() });
    expect(result.status).toBe(200);
    const flags = data(result) as Array<{ key: string; enabled: boolean; description: string }>;
    expect(Array.isArray(flags)).toBe(true);
    for (const key of ['parent_views_enabled', 'maintenance_banner', 'ops_destructive_actions']) {
      expect(flags.find((flag) => flag.key === key), `${key} must be listed`).toBeTruthy();
    }
  });

  test('flag flip: on → persisted → off, and the settings row agrees (consistency)', async () => {
    await ensureSnapshot();
    const key = 'ops_destructive_actions';
    const on = await call('PUT', `/api/ops/flags/${key}`, {
      auth: await opsJwt(),
      body: { enabled: true },
    });
    expect(on.status).toBe(200);
    expect(data(on)).toMatchObject({ key, enabled: true });

    // The flags read AND the platform-settings read serve the SAME row.
    const viaFlags = data(await call('GET', '/api/ops/flags', { auth: await opsJwt() })) as Array<{
      key: string;
      enabled: boolean;
    }>;
    expect(viaFlags.find((flag) => flag.key === key)?.enabled).toBe(true);
    const viaSettings = data(await call('GET', '/api/platform-settings', { auth: await opsJwt() }));
    expect((viaSettings?.feature_flags as Record<string, boolean>)?.[key]).toBe(true);

    const off = await call('PUT', `/api/ops/flags/${key}`, {
      auth: await opsJwt(),
      body: { enabled: false },
    });
    expect(off.status).toBe(200);
    expect(data(off)).toMatchObject({ key, enabled: false });
    const after = data(await call('GET', '/api/ops/flags', { auth: await opsJwt() })) as Array<{
      key: string;
      enabled: boolean;
    }>;
    expect(after.find((flag) => flag.key === key)?.enabled).toBe(false);
  });

  test('flag unhappy: unknown key and non-boolean are 400 with no partial write', async () => {
    const unknown = await call('PUT', '/api/ops/flags/not_a_real_flag', {
      auth: await opsJwt(),
      body: { enabled: true },
    });
    expect(unknown.status).toBe(400);
    expect(JSON.stringify(unknown.body)).toContain('Known flags');

    const nonBool = await call('PUT', '/api/ops/flags/parent_views_enabled', {
      auth: await opsJwt(),
      body: { enabled: 'yes' },
    });
    expect(nonBool.status).toBe(400);

    // Nothing was corrupted by either refusal.
    const flags = data(await call('GET', '/api/ops/flags', { auth: await opsJwt() })) as Array<{
      key: string;
      enabled: boolean;
    }>;
    expect(flags.find((flag) => flag.key === 'parent_views_enabled')?.enabled).toBe(false);
  });

  test('maintenance flag write: banner appears on the public site, then disappears', async ({
    page,
  }, testInfo) => {
    test.setTimeout(180_000); // the public landing can recompile on demand after a revalidate
    await ensureSnapshot();
    const message = `F4 maintenance probe ${STAMP}`;
    try {
      const on = await call('PUT', '/api/ops/settings/maintenance', {
        auth: await opsJwt(),
        body: { enabled: true, message },
      });
      expect(on.status).toBe(200);
      await revalidate(['platform-settings']);
      await page.goto('/');
      await page.reload();
      const banner = page.locator('[data-slot="maintenance-banner"]');
      await expect(banner).toBeVisible({ timeout: 20_000 });
      await expect(banner).toContainText(message);
      await shot(page, '30-maintenance-banner-on');

      const off = await call('PUT', '/api/ops/settings/maintenance', {
        auth: await opsJwt(),
        body: { enabled: false, message: null },
      });
      expect(off.status).toBe(200);
      await revalidate(['platform-settings']);
      await page.goto('/');
      await page.reload();
      await expect(banner).toHaveCount(0, { timeout: 20_000 });
      await shot(page, '31-maintenance-banner-off');
    } finally {
      await call('PUT', '/api/ops/settings/maintenance', {
        auth: await opsJwt(),
        body: { enabled: false, message: null },
      });
      await revalidate(['platform-settings']);
    }
  });

  test('announcement flag write: banner renders; bogus level is a 400', async ({ page }) => {
    test.setTimeout(180_000);
    await ensureSnapshot();
    const message = `F4 announcement probe ${STAMP}`;
    try {
      const bad = await call('PUT', '/api/ops/settings/announcement', {
        auth: await opsJwt(),
        body: { enabled: true, message, level: 'bogus' },
      });
      expect(bad.status, 'level outside info|warning|critical must be a 400').toBe(400);

      const on = await call('PUT', '/api/ops/settings/announcement', {
        auth: await opsJwt(),
        body: { enabled: true, message, level: 'critical' },
      });
      expect(on.status).toBe(200);
      await revalidate(['platform-settings']);
      await page.goto('/');
      await page.reload();
      const banner = page.locator('[data-slot="announcement-banner"]');
      await expect(banner).toBeVisible({ timeout: 20_000 });
      await expect(banner).toContainText(message);
      await shot(page, '32-announcement-banner-critical');
    } finally {
      await call('PUT', '/api/ops/settings/announcement', {
        auth: await opsJwt(),
        body: { enabled: false, message: null },
      });
      await revalidate(['platform-settings']);
    }
    await page.goto('/');
    await page.reload();
    await expect(page.locator('[data-slot="announcement-banner"]')).toHaveCount(0, {
      timeout: 20_000,
    });
  });

  test('rate-limit action: a malformed write is a 400 (happy write skipped by design)', async () => {
    const bad = await call('PUT', '/api/ops/settings/rate-limit', {
      auth: await opsJwt(),
      body: { max: 'lots' },
    });
    expect(bad.status).toBe(400);
    // NOTE: the happy path writes rate_limit_auth_* — the shared 20/min auth
    // limiter every concurrent fleet agent depends on. Refusing to flip it
    // mid-fleet is deliberate, not a gap in coverage ambition.
  });

  test('system surface: health, info, logs, migrations read sanely as ops', async () => {
    for (const path of ['/api/ops/system/health', '/api/ops/system/info', '/api/ops/system/logs', '/api/ops/system/migrations']) {
      const result = await call('GET', path, { auth: await opsJwt() });
      expect(result.status, `${path}`).toBe(200);
      expect(data(result), `${path} must carry data`).toBeTruthy();
    }
  });

  test('backup: run → listed; cache clear keeps the public site healthy', async ({ page }) => {
    const before = data(await call('GET', '/api/ops/system/backups', { auth: await opsJwt() }));
    const beforeCount = Array.isArray(before) ? before.length : 0;

    const run = await call('POST', '/api/ops/system/backup', { auth: await opsJwt() });
    expect(run.status, `backup run: ${JSON.stringify(run.body)}`).toBe(200);

    const after = data(await call('GET', '/api/ops/system/backups', { auth: await opsJwt() }));
    expect(Array.isArray(after)).toBe(true);
    expect((after as unknown[]).length, 'the new backup must be listed').toBe(beforeCount + 1);
    const latest = (after as Array<{ filename?: string }>)[0];
    console.log(`[f4] latest backup file: ${JSON.stringify(latest)}`);

    // DRIFT-5 contract: the operator must NAME a scope; an empty body is a 400.
    const unscoped = await call('POST', '/api/ops/system/cache/clear', { auth: await opsJwt() });
    expect(unscoped.status, 'cache clear without a scope must be a 400').toBe(400);

    const cleared = await call('POST', '/api/ops/system/cache/clear', {
      auth: await opsJwt(),
      body: { scope: 'all' },
    });
    expect(cleared.status).toBe(200);

    // The web is alive and honest after a cache clear.
    await page.goto('/privacy-policy');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 30_000 });
    await shot(page, '33-post-backup-cache-clear-web-ok');
  });

  test('refusals: anonymous and ops_support never touch flags or system', async () => {
    const paths: Array<['GET' | 'POST' | 'PUT', string, Record<string, unknown>?]> = [
      ['GET', '/api/ops/flags'],
      ['PUT', '/api/ops/flags/parent_views_enabled', { enabled: true }],
      ['PUT', '/api/ops/settings/maintenance', { enabled: true }],
      ['PUT', '/api/ops/settings/announcement', { enabled: true }],
      ['PUT', '/api/ops/settings/rate-limit', { max: 5 }],
      ['POST', '/api/ops/system/backup'],
      ['GET', '/api/ops/system/backups'],
      ['GET', '/api/ops/system/health'],
      ['GET', '/api/ops/system/logs'],
      ['POST', '/api/ops/system/cache/clear'],
    ];
    for (const [method, path, body] of paths) {
      const anon = await call(method, path, { body });
      expect([401, 403], `anonymous ${method} ${path}`).toContain(anon.status);
      const support = await call(method, path, { auth: await supportJwt(), body });
      expect(support.status, `ops_support ${method} ${path}`).toBe(403);
    }
    // And a PARENT is refused the ops-only reads too.
    const parent = await call('GET', '/api/ops/system/health', { auth: await parentJwt() });
    expect(parent.status).toBe(403);
  });

  test('capabilities read: write scope for ops, read-only for support, refused for parent', async () => {
    const ops = data(await call('GET', '/api/ops/capabilities', { auth: await opsJwt() }));
    expect(ops?.actor).toBeTruthy();
    expect(ops?.capabilities).toMatchObject({ read: true, write: true });

    const support = data(await call('GET', '/api/ops/capabilities', { auth: await supportJwt() }));
    expect(support?.actor).toMatchObject({ role: 'ops_support' });
    expect(support?.capabilities).toMatchObject({ read: true, write: false, edit_self: true });

    const parent = await call('GET', '/api/ops/capabilities', { auth: await parentJwt() });
    expect(parent.status).toBe(403);
  });
});
