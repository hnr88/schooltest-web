import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { apiEnv, runSql } from './helpers/auth-db';
import { SEEDED_PARENT } from './helpers/auth';
import { roleCredentials } from './helpers/credentials';
import { cat, loadMessages } from './helpers/i18n';
import { paceRateWindow } from './helpers/pace';

// ops/36 — the three parent-portal lists ON the generic directory kit: the C-11
// report list, the family notifications feed and the articles list. The kit's
// toolbar (search), its states (empty / no-matches) and the preserved row
// contracts are what this spec pins, at the proof's 1440x900 size plus one
// mobile capture of the feed. Screenshots attach to the run IN-SPEC.
const en = loadMessages('en');
const TEACHER_EMAIL = roleCredentials('teacher').email;
const SHOTS = path.resolve(process.cwd(), '.qa', 'screenshots');
const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 375, height: 800 };

test.beforeEach(async ({ page }) => paceRateWindow(page));

async function signIn(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(email);
  await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(password);
  await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
  await page.waitForURL('**/dashboard');
}

const kitSearch = (page: Page) =>
  page.locator('[data-slot="directory-toolbar"] input[type="search"]');

test('the C-11 report list renders through the kit with search', async ({ page }, testInfo) => {
  await page.setViewportSize(DESKTOP);
  await signIn(page, TEACHER_EMAIL, apiEnv('SEED_TEACHER_PASSWORD'));
  await page.goto('/dashboard/reports');

  // The kit chrome is unconditional; rows vs the kit's empty state depend on
  // the seed (it carries zero results by design — SEED HAS ZERO RESULTS).
  await expect(kitSearch(page)).toBeVisible({ timeout: 20_000 });
  const rows = page.locator('[data-slot="report-list-row"]');
  const kitEmpty = page.getByText(cat(en, 'Report.listEmptyTitle'));
  await expect(rows.first().or(kitEmpty)).toBeVisible({ timeout: 20_000 });

  await page.screenshot({ path: path.join(SHOTS, '36-parent-reports.png') });
  await testInfo.attach('36-parent-reports', {
    path: path.join(SHOTS, '36-parent-reports.png'),
    contentType: 'image/png',
  });

  // The kit search reduces client-side; a nonsense needle lands the kit's
  // no-matches state (never a bespoke empty line).
  await kitSearch(page).fill('zzz-no-such-report-xyz');
  await expect(page.getByText(cat(en, 'Report.listFilteredEmptyTitle'))).toBeVisible({
    timeout: 10_000,
  });
  await page.screenshot({ path: path.join(SHOTS, '36-parent-reports-search.png') });
  await testInfo.attach('36-parent-reports-search', {
    path: path.join(SHOTS, '36-parent-reports-search.png'),
    contentType: 'image/png',
  });
});

test('the notifications feed renders through the kit and mark-read flips in place', async ({
  page,
}, testInfo) => {
  await page.setViewportSize(DESKTOP);
  await signIn(page, SEEDED_PARENT.email, SEEDED_PARENT.password);
  await page.goto('/dashboard/notifications');

  await expect(kitSearch(page)).toBeVisible({ timeout: 20_000 });
  const items = page.locator('[data-notification-id]');
  const kitEmpty = page.getByText(cat(en, 'Notifications.emptyTitle'));
  await expect(items.first().or(kitEmpty)).toBeVisible({ timeout: 20_000 });

  // The unread weight: an unread row's glyph tile is the solid navy tile, and
  // its mark-read affordance flips the row in place (no full reload).
  const unreadRow = page.locator('[data-notification-id][data-read="false"]').first();
  if ((await unreadRow.count()) > 0) {
    const tile = unreadRow.locator('> span').first();
    await expect(tile).toHaveClass(/bg-foreground/);
    const markButton = unreadRow.getByRole('button', {
      name: cat(en, 'Notifications.markRead'),
    });
    if ((await markButton.count()) > 0) {
      await markButton.click();
      await expect(unreadRow).toHaveAttribute('data-read', 'true', { timeout: 10_000 });
    }
  }

  await page.screenshot({ path: path.join(SHOTS, '36-notifications.png') });
  await testInfo.attach('36-notifications', {
    path: path.join(SHOTS, '36-notifications.png'),
    contentType: 'image/png',
  });

  // Mobile width: the kit stays inside the viewport, no horizontal scroll.
  await page.setViewportSize(MOBILE);
  await expect(page.locator('[data-surface="notification-feed"]')).toBeVisible();
  expect(
    await page.locator('html').evaluate((element) => element.scrollWidth > element.clientWidth),
  ).toBe(false);
  await page.screenshot({ path: path.join(SHOTS, '36-notifications-mobile.png') });
  await testInfo.attach('36-notifications-mobile', {
    path: path.join(SHOTS, '36-notifications-mobile.png'),
    contentType: 'image/png',
  });
});

test('the articles list renders through the kit with search', async ({ page }, testInfo) => {
  await page.setViewportSize(DESKTOP);
  await page.goto('/articles');

  await expect(kitSearch(page)).toBeVisible({ timeout: 20_000 });
  const rows = page.locator('[data-slot="directory"] tbody tr');
  const kitEmpty = page.getByText(cat(en, 'Articles.emptyTitle'));
  await expect(rows.first().or(kitEmpty)).toBeVisible({ timeout: 20_000 });

  await page.screenshot({ path: path.join(SHOTS, '36-articles.png') });
  await testInfo.attach('36-articles', {
    path: path.join(SHOTS, '36-articles.png'),
    contentType: 'image/png',
  });

  await kitSearch(page).fill('zzz-no-such-article-xyz');
  await expect(page.getByText(cat(en, 'Articles.filteredEmptyTitle'))).toBeVisible({
    timeout: 10_000,
  });
});
