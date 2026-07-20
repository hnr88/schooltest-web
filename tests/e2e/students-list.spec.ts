import path from 'node:path';

import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { deleteAuthEmailRows } from './helpers/auth-db';
import { type AnyLocale, cat, icu, loadMessages } from './helpers/i18n';
import { loginParentJwt, registerAndConfirmParent } from './helpers/throwaway-parent';
import { watchErrors } from './helpers/ui';

// C-UI-MYCHILDREN: parent-owned child cards are fed by the real
// C-STUDENT-LIST-EXT endpoint (GET /api/my/students) through the typed query.
// The seeded parent has Mia + Jonas Keller; a newly provisioned parent has zero
// children and sees the real empty state instead of a fabricated card.
const en = loadMessages('en');
const SCREENSHOTS = path.resolve(process.cwd(), '.qa', 'screenshots');
const DESKTOP = { width: 1280, height: 800 };
const PARENT = { email: 'parent@schooltest.local', password: 'Parent1234!' };
const API_BASE_URL = 'http://localhost:5500';
const ALL_LOCALES: readonly AnyLocale[] = ['en', 'ko', 'ms', 'th', 'vi', 'zh'];

const usedEmails: string[] = [];

// Test hygiene (task 020 convention): drop the auth_email_requests budget rows
// the empty-state test's throwaway registration created.
test.afterAll(() => {
  for (const email of usedEmails) deleteAuthEmailRows(email);
});

async function signInAs(
  page: import('@playwright/test').Page,
  request: import('@playwright/test').APIRequestContext,
  identifier: string,
  password: string,
): Promise<void> {
  const loginRes = await request.post(`${API_BASE_URL}/api/auth/local`, {
    data: { identifier, password },
  });
  expect(loginRes.ok(), await loginRes.text()).toBeTruthy();
  const { jwt } = (await loginRes.json()) as { jwt: string };
  await page.addInitScript((token) => {
    window.localStorage.setItem('app.auth.token', token);
  }, jwt);
}

test('en: seeded parent sees Mia and Jonas as active child cards, axe clean', async ({
  page,
  request,
}) => {
  const errors = watchErrors(page);
  await page.setViewportSize(DESKTOP);
  await signInAs(page, request, PARENT.email, PARENT.password);
  await page.goto('/dashboard/children');

  await expect(
    page.getByRole('heading', { level: 1, name: cat(en, 'Children.heading') }),
  ).toBeVisible();

  await expect(page.getByLabel(cat(en, 'Children.cardListLabel'))).toBeVisible();
  const miaCard = page.getByRole('article', {
    name: icu(cat(en, 'Children.childCardLabel'), { name: 'Mia Keller' }),
  });
  await expect(miaCard).toContainText('8');
  await expect(miaCard).toContainText(cat(en, 'Children.statusActive'));

  const jonasCard = page.getByRole('article', {
    name: icu(cat(en, 'Children.childCardLabel'), { name: 'Jonas Keller' }),
  });
  await expect(jonasCard).toContainText('10');
  await expect(jonasCard).toContainText(cat(en, 'Children.statusActive'));

  await expect(page.getByText(cat(en, 'Children.emptyTitle'), { exact: true })).toHaveCount(0);

  await page.screenshot({ path: path.join(SCREENSHOTS, 'children-list-en.png') });

  const results = await new AxeBuilder({ page }).analyze();
  const blockers = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  );
  expect(
    blockers.map(
      (violation) =>
        `${violation.impact}:${violation.id} → ${violation.nodes.map((node) => node.target).join(' | ')}`,
    ),
    'children cards',
  ).toEqual([]);
  expect(errors, errors.join('\n')).toEqual([]);
});

for (const locale of ALL_LOCALES) {
  test(`${locale}: the children page renders the localized "My children" heading`, async ({
    browser,
    baseURL,
    request,
  }) => {
    const context = await browser.newContext({ baseURL, viewport: DESKTOP });
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: locale, url: baseURL ?? 'http://localhost:3100' },
    ]);
    const page = await context.newPage();
    try {
      await signInAs(page, request, PARENT.email, PARENT.password);
      const messages = loadMessages(locale);
      const pathname = locale === 'en' ? '/dashboard/children' : `/${locale}/dashboard/children`;
      await page.goto(pathname);

      await expect(
        page.getByRole('heading', { level: 1, name: cat(messages, 'Children.heading') }),
      ).toBeVisible();
    } finally {
      await context.close();
    }
  });
}

test('en: a freshly-registered parent with zero children sees the real empty state', async ({
  page,
  request,
}) => {
  const errors = watchErrors(page);
  await page.setViewportSize(DESKTOP);
  const parent = await registerAndConfirmParent(request, 'children-empty');
  usedEmails.push(parent.email);
  const jwt = await loginParentJwt(request, parent);
  await page.addInitScript((token) => {
    window.localStorage.setItem('app.auth.token', token);
  }, jwt);
  // The content entrance + empty-state pop-in fade in on mount; axe right after
  // would sample color-contrast mid-fade. Reduced motion disables the animate-in
  // variants entirely.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/dashboard/children');

  await expect(page.getByText(cat(en, 'Children.emptyTitle'), { exact: true })).toBeVisible();
  await expect(page.getByText(cat(en, 'Children.emptyDescription'))).toBeVisible();
  await expect(page.getByLabel(cat(en, 'Children.cardListLabel'))).toHaveCount(0);

  await page.screenshot({ path: path.join(SCREENSHOTS, 'children-empty-en.png') });

  const results = await new AxeBuilder({ page }).analyze();
  const blockers = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  );
  expect(
    blockers.map(
      (violation) =>
        `${violation.impact}:${violation.id} → ${violation.nodes.map((node) => node.target).join(' | ')}`,
    ),
    'children empty state',
  ).toEqual([]);
  expect(errors, errors.join('\n')).toEqual([]);
});
