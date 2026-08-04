/**
 * Mission st-legal-seo-ops E2E flows 43–51 (task 228) — the API half of the
 * settings surface: the anonymous public projection, the ops read/write
 * endpoints and the effect a write has on the public site.
 *
 * The browser-form, validation and access-control half lives in
 * platform-settings-form.spec.ts.
 *
 * Every test restores what it changed, so the suite is re-runnable.
 */
import { expect, test } from '@playwright/test';

import {
  opsReadSettings,
  opsUpdateSettings,
  publicSettings,
  revalidateSettings,
  runSql,
  sendTestEmail,
} from './helpers/settings';

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

test('flow: the test email action sends a real message and rejects a bad address', async () => {
  const to = `settings-probe-${Date.now()}@schooltest.local`;
  const ok = await sendTestEmail(to);
  expect(ok.status).toBe(200);
  expect((ok.body as { data: { sent: boolean; to: string } }).data).toMatchObject({ sent: true, to });

  const bad = await sendTestEmail('not-an-email');
  expect(bad.status).toBe(400);
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
