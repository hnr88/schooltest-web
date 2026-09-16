/**
 * F8 probe — diagnose the sign-in flow against the live dev server.
 * Scratch diagnostic, not an assertion suite.
 */
import { expect, test } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

test('probe sign-in as t2', async ({ page }) => {
  test.setTimeout(120_000);
  const calls: string[] = [];
  page.on('response', (res) => {
    calls.push(`${res.status()} ${res.request().method()} ${res.url()}`);
  });
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') calls.push(`console.${m.type()}: ${m.text()}`);
  });
  page.on('pageerror', (e) => calls.push(`pageerror: ${e.message}`));

  await page.goto('/sign-in');
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.screenshot({ path: 'tests/e2e/captures/fleet8/00-probe-signin-page.png' });

  const email = page.locator('input[type="email"], input[name="email"], input#email').first();
  const count = await email.count();
  console.log('[probe] email input count:', count);
  if (count > 0) {
    await email.fill('t2@schooltest.local');
    const pw = page.locator('input[type="password"]').first();
    await pw.fill('Teacher1234!');
    await page.screenshot({ path: 'tests/e2e/captures/fleet8/00-probe-signin-filled.png' });
    const btn = page.getByRole('button', { name: /log in|sign in|login/i }).first();
    console.log('[probe] button text:', await btn.textContent());
    await btn.click();
    await page.waitForTimeout(8000);
    console.log('[probe] final URL:', page.url());
    await page.screenshot({ path: 'tests/e2e/captures/fleet8/00-probe-after-submit.png' });
  }
  for (const c of calls.slice(-60)) console.log('[probe]', c);
  expect(true).toBe(true);
});
