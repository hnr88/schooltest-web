import { test, expect } from '@playwright/test';
import { opsJwtHelper } from './helpers/n2w1-probe-helper';

test('probe completed-onboarding reopen', async ({ page, request }) => {
  const jwt = await opsJwtHelper(request);
  const email = `e2e-n2w1-probe-onb3-${Date.now().toString(36)}@schooltest.test`;
  const adminEmail = `e2e-n2w1-probe-adm3-${Date.now().toString(36)}@schooltest.test`;
  const schoolRes = await request.post('http://127.0.0.1:5500/api/schools', {
    headers: { Authorization: `Bearer ${jwt}`, 'X-Ops-Portal-Version': '1', 'Idempotency-Key': `p8-${Date.now()}` },
    data: { name: `N2 W1 P8 ${Date.now().toString(36)}`, suburb: 'Brunswick', contact_name: 'P W1', contact_email: email, state: 'VIC', sector: 'government', portal: { plan: 'standard', status: 'active', send_owner_invitation: false } },
  });
  const school = ((await schoolRes.json()) as { data: { documentId: string } }).data;
  const linkRes = await request.post(`http://127.0.0.1:5500/api/schools/${school.documentId}/onboarding-link`, {
    headers: { Authorization: `Bearer ${jwt}`, 'X-Ops-Portal-Version': '1' },
    data: { first_name: 'Priya', last_name: 'W1', contact_email: email },
  });
  const link = ((await linkRes.json()) as { data: { url: string } }).data.url;
  const path = link.replace(/^https?:\/\/[^/]+/, '');
  await page.goto(path);
  await expect(page.getByRole('heading', { name: 'Confirm your school details' })).toBeVisible({ timeout: 30000 });
  await page.getByLabel(/^Suburb\*?$/).fill('Brunswick');
  await page.getByLabel(/^Postcode\*?$/).fill('3056');
  await page.locator('#onb-school-state').click();
  await page.locator('[role="option"]:visible', { hasText: 'VIC' }).first().click();
  await page.locator('#onb-school-sector').click();
  await page.locator('[role="option"]:visible', { hasText: 'Government' }).first().click();
  await page.getByRole('button', { name: 'Save and continue' }).click();
  await expect(page.getByRole('heading', { name: 'Add your teachers' })).toBeVisible({ timeout: 20000 });
  await page.getByRole('button', { name: 'Save and continue' }).click();
  await expect(page.getByRole('heading', { name: 'Review and confirm' })).toBeVisible({ timeout: 20000 });
  await page.getByRole('button', { name: 'Confirm and continue' }).click();
  await expect(page.getByRole('heading', { name: 'Create your administrator account' })).toBeVisible({ timeout: 20000 });
  await page.getByLabel(/^First name\*?$/).fill('Priya');
  await page.getByLabel(/^Last name\*?$/).fill('W1');
  await page.getByLabel(/^Email address\*?$/).fill(adminEmail);
  await page.getByLabel(/^Password\*?$/).fill('N2w1Onboard!2026');
  await page.getByRole('button', { name: 'Create account and finish' }).click();
  await page.waitForURL(/\/dashboard(\/|$)/, { timeout: 30000 });
  console.log('LANDED:', page.url());
  await page.evaluate(() => window.localStorage.removeItem('app.auth.token'));
  await page.goto(path);
  await page.waitForTimeout(6000);
  console.log('REOPEN-URL:', page.url());
  console.log('REOPEN-TEXT:', JSON.stringify(await page.evaluate(() => document.body.innerText.slice(0, 400))));
});
