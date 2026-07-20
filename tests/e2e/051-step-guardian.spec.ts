import path from 'node:path';

import { expect, type Page, test } from '@playwright/test';

import { deleteAuthEmailRows } from './helpers/auth-db';
import { cat, icu, loadMessages, type AnyLocale, type Messages } from './helpers/i18n';
import { loginParentJwt, registerAndConfirmParent } from './helpers/throwaway-parent';
import { watchErrors } from './helpers/ui';

// Task 051 evidence — Step 3 Guardian + §5.12 ContactChannelCards driven through
// the REAL wizard on :3100 with a throwaway parent JWT (never the seeded parent).
const en = loadMessages('en');
const EVIDENCE = path.resolve(process.cwd(), '..', '.qa', 'evidence');
const usedEmails: string[] = [];

test.describe.configure({ mode: 'serial' });

async function authAndGoto(page: Page, request: import('@playwright/test').APIRequestContext) {
  const parent = await registerAndConfirmParent(request, 'step-guardian');
  usedEmails.push(parent.email);
  const jwt = await loginParentJwt(request, parent);
  await page.addInitScript((token) => {
    window.localStorage.setItem('app.auth.token', token);
  }, jwt);
}

async function fillToStep3(page: Page, m: Messages, locale: AnyLocale = 'en') {
  await page.goto(
    locale === 'en' ? '/dashboard/children/new' : `/${locale}/dashboard/children/new`,
  );
  // Step 1 — Personal (required: given, family, nationality)
  await page.getByLabel(cat(m, 'StudentWizard.personal.givenName')).fill('Mia');
  await page.getByLabel(cat(m, 'StudentWizard.personal.familyName')).fill('Chen');
  await page.getByRole('combobox', { name: cat(m, 'StudentWizard.personal.nationality') }).click();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: cat(m, 'StudentWizard.continue') }).click();
  // Step 2 — Education (required: target entry year, target entry term)
  await page
    .getByRole('combobox', { name: cat(m, 'StudentWizard.education.targetEntryYear') })
    .click();
  await page.getByRole('option').first().click();
  await page
    .getByRole('group', { name: cat(m, 'StudentWizard.education.targetEntryTerm') })
    .getByText(icu(cat(m, 'StudentWizard.education.term'), { n: '1' }), { exact: true })
    .click();
  await page.getByRole('button', { name: cat(m, 'StudentWizard.continue') }).click();
  // Step 3 — the ContactChannelCards radiogroup is unique to this step
  await expect(
    page.getByRole('radiogroup', { name: cat(m, 'StudentWizard.guardian.preferredContact') }),
  ).toBeVisible();
}

test('EN: step 3 cards render, default whatsapp, click/keyboard select, validation, advance', async ({
  page,
  request,
}) => {
  const errors = watchErrors(page);
  await authAndGoto(page, request);
  await fillToStep3(page, en);

  const group = page.getByRole('radiogroup', {
    name: cat(en, 'StudentWizard.guardian.preferredContact'),
  });
  await expect(group).toBeVisible();
  const whatsapp = group.getByRole('radio', {
    name: cat(en, 'StudentWizard.guardian.channel.whatsapp'),
  });
  const wechat = group.getByRole('radio', {
    name: cat(en, 'StudentWizard.guardian.channel.wechat'),
  });
  const email = group.getByRole('radio', { name: cat(en, 'StudentWizard.guardian.channel.email') });

  // Default whatsapp preselected
  await expect(whatsapp).toHaveAttribute('aria-checked', 'true');
  await expect(wechat).toHaveAttribute('aria-checked', 'false');
  await page.screenshot({ path: path.join(EVIDENCE, '051-step3.png'), fullPage: true });

  // Click wechat → selection flips
  await wechat.click();
  await expect(wechat).toHaveAttribute('aria-checked', 'true');
  await expect(whatsapp).toHaveAttribute('aria-checked', 'false');

  // Keyboard: focus selected (wechat, tabIndex 0), ArrowRight moves + selects email
  await wechat.focus();
  await page.keyboard.press('ArrowRight');
  await expect(email).toHaveAttribute('aria-checked', 'true');
  await expect(email).toBeFocused();
  // Space keeps focused card selected
  await page.keyboard.press('ArrowLeft');
  await expect(wechat).toHaveAttribute('aria-checked', 'true');

  // Validation: empty name/phone → required errors + focus first invalid (name)
  await page.getByRole('button', { name: cat(en, 'StudentWizard.continue') }).click();
  await expect(page.getByText(cat(en, 'StudentWizardSchema.guardianNameRequired'))).toBeVisible();
  await expect(page.getByText(cat(en, 'StudentWizardSchema.guardianPhoneRequired'))).toBeVisible();
  await expect(page.getByLabel(cat(en, 'StudentWizard.guardian.name'))).toBeFocused();
  // Still on step 3 (radiogroup still present, not advanced)
  await expect(group).toBeVisible();

  // Valid fill → advances to step 4 (media)
  const nameInput = page.getByLabel(cat(en, 'StudentWizard.guardian.name'));
  const phoneInput = page.getByLabel(cat(en, 'StudentWizard.guardian.phone'));
  await nameInput.fill('Wei Chen');
  await phoneInput.fill('+44 7700 900000');
  await expect(nameInput).toHaveValue('Wei Chen');
  await expect(phoneInput).toHaveValue('+44 7700 900000');
  await phoneInput.blur();
  await page.getByRole('button', { name: cat(en, 'StudentWizard.continue') }).click();
  await expect(page.getByText('Step 4 of 5', { exact: false })).toBeVisible();
  // Step 4 now renders StepMedia (task 052 swapped the placeholder heading for the
  // MediaUpload dropzones); assert the photo drop-zone copy instead of the old h2.
  await expect(page.getByText(cat(en, 'StudentWizard.media.photo.dropTitle'))).toBeVisible();

  expect(errors).toEqual([]);
});

test('ZH: step 3 renders localized labels and channel names', async ({ page, request }) => {
  const zh = loadMessages('zh' as AnyLocale);
  await authAndGoto(page, request);
  await fillToStep3(page, zh, 'zh');

  const group = page.getByRole('radiogroup', {
    name: cat(zh, 'StudentWizard.guardian.preferredContact'),
  });
  await expect(group).toBeVisible();
  await expect(
    group.getByRole('radio', { name: cat(zh, 'StudentWizard.guardian.channel.wechat') }),
  ).toBeVisible();
  await expect(page.getByLabel(cat(zh, 'StudentWizard.guardian.name'))).toBeVisible();
  await page.screenshot({ path: path.join(EVIDENCE, '051-step3-zh.png'), fullPage: true });
});

test.afterAll(() => {
  for (const email of usedEmails) {
    deleteAuthEmailRows(email);
  }
});
