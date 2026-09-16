import { test } from '@playwright/test';
import { roleCredentials } from './helpers/credentials';

test('F1 probe: double-click login outcome', async ({ page }) => {
  test.setTimeout(180_000);
  const events: string[] = [];
  page.on('request', (r) => {
    const u = new URL(r.url());
    if (u.pathname === '/api/auth/local') events.push(`REQ ${r.method()} id=${r.postDataBuffer()?.length}`);
  });
  page.on('response', (r) => {
    const u = new URL(r.url());
    if (u.pathname === '/api/auth/local') events.push(`RES ${r.status()}`);
  });
  page.on('requestfailed', (r) => {
    const u = new URL(r.url());
    if (u.pathname === '/api/auth/local') events.push(`FAILED ${r.failure()?.errorText}`);
  });
  const parent = roleCredentials('parent');
  await page.goto('/sign-in');
  await page.getByLabel('Email address', { exact: true }).fill(parent.email);
  await page.getByLabel('Password', { exact: true }).fill(parent.password);
  const button = page.getByRole('button', { name: 'Log in', exact: true });
  await button.click();
  await button.click({ force: true }).catch((e) => events.push(`click2 error: ${e.message.split('\n')[0]}`));
  for (let i = 0; i < 30; i += 1) {
    await page.waitForTimeout(1000);
    if (!page.url().includes('sign-in')) break;
  }
  console.log('[probe] final URL:', page.url());
  console.log('[probe] token:', await page.evaluate(() => window.localStorage.getItem('app.auth.token')));
  for (const e of events) console.log('[probe]', e);
  await page.screenshot({ path: 'tests/e2e/captures/fleet1/probe-dblclick-final2.png' });
});
