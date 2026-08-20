// Throwaway visual audit: log in as the seeded school admin on the user's
// running :3000 instance, open every dropdown on the class surfaces, and
// screenshot each one. Secrets stay inside the process — nothing is printed.
import { readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const apiEnv = readFileSync(new URL('../../schooltest-api/.env', import.meta.url), 'utf8');
const password = apiEnv.match(/^SEED_SCHOOLADMIN_A_PASSWORD=(.*)$/m)?.[1]?.trim().replace(/^['"]|['"]$/g, '');
if (!password) throw new Error('SEED_SCHOOLADMIN_A_PASSWORD not found');

const BASE = 'http://localhost:3000';
const OUT = new URL('../.qa-shots/', import.meta.url).pathname;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const shot = (name) => page.screenshot({ path: `${OUT}dropdown-audit-${name}.png` });

await page.goto(`${BASE}/sign-in`);
await page.getByLabel('Email', { exact: true }).fill('schooladmin-a@schooltest.local');
await page.getByLabel('Password', { exact: true }).fill(password);
await page.getByRole('button', { name: 'Sign in', exact: true }).click();
try {
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
} catch {
  await shot('00-login-stuck');
  console.log('stuck at', page.url());
  console.log('visible text:', (await page.locator('body').innerText()).slice(0, 500));
  await browser.close();
  process.exit(1);
}

// Class detail page (the user's class).
await page.goto(`${BASE}/dashboard/school/classes/dip2rcry8s2yj5n7ay18gwds`);
await page.waitForLoadState('networkidle');
await shot('01-class-detail');

// Edit-class dialog with the teacher dropdown (closed).
await page.getByRole('button', { name: /edit class/i }).click();
await page.waitForTimeout(600);
await shot('02-edit-dialog');

// Open the native teacher select via keyboard so headless renders its listbox.
await page.locator('#edit-class-teacher').focus();
await page.keyboard.press('Space');
await page.waitForTimeout(400);
await shot('03-teacher-select-open');
await page.keyboard.press('Escape');
await page.getByRole('button', { name: /cancel/i }).click();

// Classes list: row-actions dropdown menu.
await page.goto(`${BASE}/dashboard/school/classes`);
await page.waitForLoadState('networkidle');
const rowMenu = page.getByRole('button', { name: /actions|menu/i }).first();
if (await rowMenu.count()) {
  await rowMenu.click();
  await page.waitForTimeout(500);
  await shot('04-row-actions-menu');
  await page.keyboard.press('Escape');
}

// User menu (avatar card) in the shell.
const userMenu = page.getByRole('button', { name: /user menu|account|profile/i }).first();
if (await userMenu.count()) {
  await userMenu.click();
  await page.waitForTimeout(500);
  await shot('05-user-menu');
  await page.keyboard.press('Escape');
}

// Locale switcher, wherever it lives.
const locale = page.getByRole('combobox', { name: /language|locale/i }).first();
if (await locale.count()) {
  await locale.click();
  await page.waitForTimeout(500);
  await shot('06-locale-switcher');
  await page.keyboard.press('Escape');
}

// Students list + student form selects (EALD native selects).
await page.goto(`${BASE}/dashboard/school/students`);
await page.waitForLoadState('networkidle');
await shot('07-students');

await browser.close();
console.log('done');
