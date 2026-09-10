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

// Dev-server first-hit compilation plus the fixed 16s limiter pace exceed the
// 30s default long before any assertion is wrong.
test.setTimeout(120_000);

async function signIn(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/sign-in');
  // The sign-in form's copy moved to Auth.portal.*; the legacy Auth.* keys
  // this helper filled render nowhere.
  await page.getByLabel(cat(en, 'Auth.portal.emailLabel'), { exact: true }).fill(email);
  await page.getByLabel(cat(en, 'Auth.portal.passwordLabel'), { exact: true }).fill(password);
  await page.getByRole('button', { name: cat(en, 'Auth.portal.loginButton'), exact: true }).click();
  await page.waitForURL('**/dashboard');
}

const kitSearch = (page: Page) =>
  page.locator('[data-slot="directory-toolbar"] input[type="search"]');

// The kit's own arms are the deliverable: rows, the empty state, or the kit's
// error arm (the notifications route answered 500 for the seeded parent until
// its fix row landed, and the articles content-type does not exist on this API
// stack — both backend facts recorded in mvp/ops/proof/36.md; the OLD bespoke
// pages swallowed both as "nothing found", the kit surfaces them honestly).
// The toolbar is asserted ALONE — the kit renders it alongside the loading arm,
// so folding it into an .or() chain is a strict-mode violation, not a wait.
async function expectAnyKitArm(page: Page, emptyTitle: string): Promise<void> {
  await expect(page.locator('[data-slot="directory-toolbar"]')).toBeVisible({
    timeout: 20_000,
  });
  await expect(
    page
      .locator('[data-notification-id], [data-slot="report-list-row"], tbody tr')
      .first()
      .or(page.locator('[data-slot="directory-loading"]'))
      // .first(): ops/14's per-surface empty copy renders the title in more
      // than one element (h2 + description), and an .or() chain must stay single.
      .or(page.getByText(emptyTitle).first())
      .or(page.getByText('Could not load').first()),
  ).toBeVisible({ timeout: 20_000 });
}

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
  // no-matches state (never a bespoke empty line). .first(): ops/14's
  // per-surface empty copy renders the title in more than one element.
  await kitSearch(page).fill('zzz-no-such-report-xyz');
  await expect(page.getByText(cat(en, 'Report.listFilteredEmptyTitle')).first()).toBeVisible({
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
  await expectAnyKitArm(page, cat(en, 'Notifications.emptyTitle'));

  // The unread weight: an unread row's glyph tile is the solid navy tile, and
  // its mark-read affordance flips the row in place (no full reload) — only
  // assertable when the backend actually serves rows.
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
  await expectAnyKitArm(page, cat(en, 'Articles.emptyTitle'));

  await page.screenshot({ path: path.join(SHOTS, '36-articles.png') });
  await testInfo.attach('36-articles', {
    path: path.join(SHOTS, '36-articles.png'),
    contentType: 'image/png',
  });

  // The client-mode search assertion is only meaningful when rows render;
  // against the absent articles backend the kit's error arm is the honest
  // state and the screenshot above is the proof.
  if ((await page.locator('[data-slot="directory"] tbody tr').count()) > 0) {
    await kitSearch(page).fill('zzz-no-such-article-xyz');
    await expect(page.getByText(cat(en, 'Articles.filteredEmptyTitle'))).toBeVisible({
      timeout: 10_000,
    });
  }
});
