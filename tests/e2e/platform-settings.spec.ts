/**
 * Mission st-legal-seo-ops E2E flows 43–51 (task 228): the settings surface is
 * real — values persist to Postgres, the public site reflects them, and invalid
 * values are refused with per-field errors.
 *
 * Every test restores what it changed, so the suite is re-runnable.
 */
import { expect, test } from '@playwright/test';

import { loadMessages } from './helpers/i18n';
import { loginAs } from './helpers/roles';
import {
  opsReadSettings,
  opsUpdateSettings,
  publicSettings,
  revalidateSettings,
  runSql,
  sendTestEmail,
} from './helpers/settings';

const en = loadMessages('en');

test.describe.configure({ mode: 'serial' });

test('flow: the public projection exposes ONLY the allow-listed keys', async () => {
  const body = await publicSettings();
  expect(Object.keys(body).sort()).toEqual(
    [
      'announcement_enabled', 'announcement_level', 'announcement_message',
      'maintenance_message', 'maintenance_mode', 'pagination_default_page_size',
      'seo_default_description', 'seo_default_og_image', 'seo_default_title',
      'site_name', 'site_tagline',
    ].sort(),
  );
  // The same row holds these; none may leak to an anonymous caller.
  for (const secret of [
    'email_from_address', 'email_provider', 'session_timeout_minutes',
    'rate_limit_auth_max', 'feature_flags', 'upload_max_size_mb',
  ]) {
    expect(body, `${secret} must not be public`).not.toHaveProperty(secret);
  }
});

test('flow: updating the site name and tagline changes the public site', async ({ page }) => {
  const before = await opsReadSettings();
  const probeName = `SchoolTest E2E ${Date.now()}`;
  try {
    await opsUpdateSettings({ site_name: probeName, site_tagline: 'E2E tagline probe' });
    expect(runSql('select site_name from platform_settings')).toBe(probeName);

    await revalidateSettings();
    await page.goto('/');
    await page.reload();

    await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute('content', probeName);
    await expect(page.locator('footer').getByText('E2E tagline probe')).toBeVisible();
  } finally {
    await opsUpdateSettings({ site_name: before.site_name, site_tagline: before.site_tagline });
    await revalidateSettings();
  }
});

test('flow: enabling maintenance mode shows the banner to a public visitor', async ({ page }) => {
  const message = `Scheduled maintenance E2E ${Date.now()}`;
  try {
    await opsUpdateSettings({ maintenance_mode: true, maintenance_message: message });
    await revalidateSettings();
    await page.goto('/');
    await page.reload();

    const banner = page.locator('[data-slot="maintenance-banner"]');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText(message);
  } finally {
    await opsUpdateSettings({ maintenance_mode: false, maintenance_message: null });
    await revalidateSettings();
  }

  await page.goto('/');
  await page.reload();
  await expect(page.locator('[data-slot="maintenance-banner"]')).toHaveCount(0);
});

test('flow: the announcement banner renders at its configured level', async ({ page }) => {
  const message = `Announcement E2E ${Date.now()}`;
  try {
    await opsUpdateSettings({
      announcement_enabled: true,
      announcement_message: message,
      announcement_level: 'warning',
    });
    await revalidateSettings();
    await page.goto('/');
    await page.reload();

    const banner = page.locator('[data-slot="announcement-banner"]');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText(message);
  } finally {
    await opsUpdateSettings({ announcement_enabled: false, announcement_message: null });
    await revalidateSettings();
  }
});

test('flow: invalid values are refused with per-field errors and nothing persists', async () => {
  const before = await opsReadSettings();

  const cases: { patch: Record<string, unknown>; path: string }[] = [
    { patch: { session_timeout_minutes: 1 }, path: 'session_timeout_minutes' },
    { patch: { session_timeout_minutes: 99999 }, path: 'session_timeout_minutes' },
    { patch: { upload_max_size_mb: 0 }, path: 'upload_max_size_mb' },
    { patch: { pagination_default_page_size: 500 }, path: 'pagination_default_page_size' },
    { patch: { pagination_max_page_size: 5, pagination_default_page_size: 50 }, path: 'pagination_max_page_size' },
    { patch: { email_from_address: 'not-an-email' }, path: 'email_from_address' },
    { patch: { announcement_level: 'shouty' }, path: 'announcement_level' },
    { patch: { feature_flags: { not_a_real_flag: true } }, path: 'feature_flags.not_a_real_flag' },
    { patch: { site_name: '' }, path: 'site_name' },
  ];

  for (const { patch, path } of cases) {
    const res = await opsUpdateSettings(patch, { expectFailure: true });
    expect(res.status, `${JSON.stringify(patch)} must be refused`).toBe(400);
    const paths = (res.body as { error: { details: { errors: { path: string }[] } } }).error.details
      .errors.map((entry) => entry.path);
    expect(paths, `${JSON.stringify(patch)} error path`).toContain(path);
  }

  // Nothing from the rejected batch may have persisted.
  const after = await opsReadSettings();
  expect(after.session_timeout_minutes).toBe(before.session_timeout_minutes);
  expect(after.upload_max_size_mb).toBe(before.upload_max_size_mb);
  expect(after.site_name).toBe(before.site_name);
});

test('flow: a bounded value at each edge IS accepted', async () => {
  const before = await opsReadSettings();
  try {
    await opsUpdateSettings({ session_timeout_minutes: 5, upload_max_size_mb: 100 });
    expect(runSql('select session_timeout_minutes from platform_settings')).toBe('5');
    expect(runSql('select upload_max_size_mb from platform_settings')).toBe('100');
  } finally {
    await opsUpdateSettings({
      session_timeout_minutes: before.session_timeout_minutes,
      upload_max_size_mb: before.upload_max_size_mb,
    });
  }
});

test('flow: the test email action sends a real message and rejects a bad address', async () => {
  const to = `settings-probe-${Date.now()}@schooltest.local`;
  const ok = await sendTestEmail(to);
  expect(ok.status).toBe(200);
  expect((ok.body as { data: { sent: boolean; to: string } }).data).toMatchObject({ sent: true, to });

  const bad = await sendTestEmail('not-an-email');
  expect(bad.status).toBe(400);
});

test('flow: an ops user reaches the settings screen with real values', async ({ page }) => {
  await loginAs(page, 'ops');
  await page.goto('/dashboard/ops/settings');
  await expect(
    page.getByRole('heading', { level: 1, name: en['Ops.settings.title'] }),
  ).toBeVisible();
  await expect(page.locator('#setting-site_name')).toHaveValue(/.+/);
  await expect(page.locator('#setting-session_timeout_minutes')).toHaveValue(/^\d+$/);
});

// A SEPARATE test so the browser context is fresh: signing in as a second role
// on a page that already holds a session lands on /dashboard, not /sign-in.
test('flow: a teacher cannot reach the ops settings screen', async ({ page, request }) => {
  await loginAs(page, 'teacher');
  await page.goto('/dashboard/ops/settings');

  // The client guard bounces a non-ops role back to a route they can open. It
  // resolves after /api/users/me answers, so wait for the navigation rather
  // than reading the URL the instant the form is absent.
  await page.waitForURL(/\/dashboard(?!\/ops)/, { timeout: 15_000 });
  await expect(page.locator('#setting-site_name')).toHaveCount(0);

  // The real boundary is the API, not the guard: prove it refuses the teacher
  // token directly.
  const token = await page.evaluate(() => window.localStorage.getItem('app.auth.token'));
  const res = await request.get(`${process.env.E2E_API_BASE_URL ?? 'http://127.0.0.1:5500'}/api/platform-settings`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(res.status(), 'the API must refuse a teacher token').toBe(403);
});

test('flow: settings changes are audited', async () => {
  const before = Number.parseInt(
    runSql("select count(*) from audit_logs where action='settings.update'"),
    10,
  );
  const current = await opsReadSettings();
  await opsUpdateSettings({ site_tagline: current.site_tagline });
  const after = Number.parseInt(
    runSql("select count(*) from audit_logs where action='settings.update'"),
    10,
  );
  expect(after, 'every settings write must add exactly one audit row').toBe(before + 1);
});
