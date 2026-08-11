import { test } from '@playwright/test';

import { apiEnv } from './helpers/auth-db';
import { cat, loadMessages } from './helpers/i18n';

const en = loadMessages('en');

test('diag: context-created page can sign in', async ({ browser }) => {
  test.setTimeout(90_000);
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  page.on('response', (response) => {
    if (response.url().includes('/api/auth/local') || response.url().includes('/api/users/me')) {
      console.log('RESP', response.status(), response.url());
    }
  });
  page.on('console', (message) => {
    if (message.type() === 'error') console.log('CONSOLE ERROR', message.text());
  });
  await page.goto('/sign-in');
  console.log('URL after goto:', page.url());
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill('teacher@schooltest.local');
  await page
    .getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true })
    .fill(apiEnv('SEED_TEACHER_PASSWORD'));
  await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
  await page.waitForTimeout(8000);
  console.log('URL after click:', page.url());
  await context.close();
});
