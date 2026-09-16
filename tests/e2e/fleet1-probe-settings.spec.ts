import { test } from '@playwright/test';

const EMAIL = 'e2e-f1probe-settings-mu42pqja313i@schooltest.test';
const PASSWORD = 'E2eParent1234!';

test('F1 probe: what does /dashboard/settings render for a fresh parent?', async ({ page }) => {
  test.setTimeout(180_000);
  const calls: string[] = [];
  page.on('response', (r) => {
    const u = new URL(r.url());
    if (u.port === '5500') calls.push(`${r.status()} ${r.request().method()} ${u.pathname}`);
  });
  await page.goto('/sign-in');
  await page.getByLabel('Email address', { exact: true }).fill(EMAIL);
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await page.waitForURL('**/dashboard', { timeout: 30_000 });
  calls.length = 0;
  await page.goto('/dashboard/settings');
  for (const wait of [3, 5, 10, 20]) {
    await page.waitForTimeout(wait === 3 ? 3000 : wait - (wait === 5 ? 3 : wait === 10 ? 5 : 10) * 1000);
    const mask = await page.getByText('Not part of this release').count();
    const card = await page.getByText('Change password', { exact: true }).count();
    console.log(`[probe] t≈${wait}s mask=${mask} changePasswordCard=${card}`);
  }
  console.log('[probe] api calls:', calls.join(' | '));
  await page.screenshot({ path: 'tests/e2e/captures/fleet1/probe-parent-settings-final.png', fullPage: true });
});
