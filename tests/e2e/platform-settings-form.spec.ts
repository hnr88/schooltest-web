/**
 * Mission st-legal-seo-ops E2E flows 43–51 (task 228) — the browser half of the
 * settings surface: which values are refused, who may open the ops screen and
 * what the form does with real keystrokes.
 *
 * The public projection and the ops read/write endpoints live in
 * platform-settings.spec.ts.
 *
 * Every test restores what it changed, so the suite is re-runnable.
 */
import { expect, test } from '@playwright/test';

import { loadMessages } from './helpers/i18n';
import { loginAs } from './helpers/roles';
import {
  opsReadSettings,
  opsUpdateSettings,
  revalidateSettings,
  runSql,
} from './helpers/settings';

const en = loadMessages('en');

test.describe.configure({ mode: 'serial' });

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

test('flow: an ops user reaches the settings screen with real values', async ({ page }) => {
  await loginAs(page, 'ops');
  await page.goto('/dashboard/ops/settings');
  await expect(
    page.getByRole('heading', { level: 1, name: en['Ops.settings.title'] }),
  ).toBeVisible();
  await expect(page.locator('#setting-site_name')).toHaveValue(/.+/);
  await expect(page.locator('#setting-session_timeout_minutes')).toHaveValue(/^\d+$/);
});

// Every other flow in this mission writes through the API helper, so a DEAD FORM
// still passed the suite. This one types into the real inputs, presses the real
// Save button and reads Postgres back — the only assertion that fails when the
// browser-side form state stops collecting keystrokes.
test('flow: editing the form itself persists to Postgres and survives a reload', async ({
  page,
}) => {
  const before = await opsReadSettings();
  const probeName = `SchoolTest Form E2E ${Date.now()}`;
  const probeTagline = `Typed in the browser ${Date.now()}`;
  const probeTimeout = before.session_timeout_minutes === 45 ? 60 : 45;

  await loginAs(page, 'ops');
  await page.goto('/dashboard/ops/settings');
  await expect(page.locator('#setting-site_name')).toHaveValue(before.site_name);

  try {
    // One field of each kind that is typed into: text, textarea and number.
    await page.locator('#setting-site_name').fill(probeName);
    await page.locator('#setting-site_tagline').fill(probeTagline);
    await page.locator('#setting-session_timeout_minutes').fill(String(probeTimeout));
    await expect(page.locator('#setting-site_name')).toHaveValue(probeName);
    await expect(page.getByText(en['Ops.settings.unsaved'], { exact: true })).toBeVisible();

    await page.getByRole('button', { name: en['Ops.settings.save'], exact: true }).click();

    const toast = page.locator('[data-sonner-toast][data-type="success"]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(en['Ops.settings.savedToast']);

    expect(runSql('select site_name from platform_settings')).toBe(probeName);
    expect(runSql('select site_tagline from platform_settings')).toBe(probeTagline);
    expect(runSql('select session_timeout_minutes from platform_settings')).toBe(
      String(probeTimeout),
    );

    await page.reload();
    await expect(page.locator('#setting-site_name')).toHaveValue(probeName);
    await expect(page.locator('#setting-site_tagline')).toHaveValue(probeTagline);
    await expect(page.locator('#setting-session_timeout_minutes')).toHaveValue(
      String(probeTimeout),
    );
  } finally {
    await opsUpdateSettings({
      site_name: before.site_name,
      site_tagline: before.site_tagline,
      session_timeout_minutes: before.session_timeout_minutes,
    });
    await revalidateSettings();
  }
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
