import path from 'node:path';

import { expect, test } from '@playwright/test';

import { roleCredentials } from './helpers/credentials';
import { API_BASE_URL } from './helpers/mailpit';

// F9 PROBE (scratch): what does the LIVE portal actually render for the parent?
// Decides whether this stack runs with parent views enabled before the slice
// specs are written. Screenshot proves whichever state is live.
// Screenshots are staged in /tmp/fleet9-shots during the run and copied into
// tests/e2e/captures/fleet9 at the end (inotify watch pressure on the live
// dev server — Turbopack panics when a globbed dir gains files mid-run).

const SHOTS = '/tmp/fleet9-shots';

test('probe: parent lands on /dashboard/children as parent@schooltest.local', async ({ page }) => {
  test.setTimeout(90_000);
  const login = await page.request.post(`${API_BASE_URL}/api/auth/local`, {
    data: { identifier: roleCredentials('parent').email, password: roleCredentials('parent').password },
  });
  expect(login.ok(), await login.text()).toBeTruthy();
  const { jwt } = (await login.json()) as { jwt: string };
  await page.addInitScript((token) => {
    window.localStorage.setItem('app.auth.token', token);
  }, jwt);

  await page.goto('/dashboard/children');
  await page.waitForTimeout(8_000); // dev-compile + client guards
  await page.screenshot({ path: path.join(SHOTS, '00-probe-children.png'), fullPage: true });
  console.log('PROBE URL:', page.url());
  console.log('PROBE BODY HEAD:', (await page.locator('body').innerText()).slice(0, 1500));

  await page.goto('/dashboard');
  await page.waitForTimeout(4_000);
  await page.screenshot({ path: path.join(SHOTS, '00-probe-dashboard.png'), fullPage: true });
  console.log('PROBE DASH URL:', page.url());
});
