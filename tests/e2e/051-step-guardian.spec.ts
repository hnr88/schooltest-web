import path from 'node:path';

import { expect, type Page, test } from '@playwright/test';

import { deleteAuthEmailRows } from './helpers/auth-db';
import { cat, loadMessages, type AnyLocale, type Messages } from './helpers/i18n';
import { loginParentJwt, registerAndConfirmParent, skipOnboarding } from './helpers/throwaway-parent';
import { watchErrors } from './helpers/ui';
import {
  fillEducationStep,
  fillPersonalStep,
  gotoNewChildWizard,
  wizardContinue,
} from './helpers/wizard-fill';

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
  // Fresh parents start onboarding-pending; the dashboard guard would redirect
  // /dashboard/* to /onboarding, so resolve it through the real endpoint first.
  await skipOnboarding(request, jwt);
  await page.addInitScript((token) => {
    window.localStorage.setItem('app.auth.token', token);
  }, jwt);
}

// Steps 1–2 are gated and every field is mandatory (task 005) — reaching step 3
// means filling each earlier step VALIDLY via the shared helpers.
async function fillToStep3(page: Page, m: Messages, locale: AnyLocale = 'en') {
  await gotoNewChildWizard(page, locale);
  await fillPersonalStep(page, m);
  await wizardContinue(page, m);
  await fillEducationStep(page, m);
  await wizardContinue(page, m);
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

  // Validation: empty name/phone/email → required errors + focus first invalid (name)
  await page.getByRole('button', { name: cat(en, 'StudentWizard.continue') }).click();
  await expect(page.getByText(cat(en, 'StudentWizardSchema.guardianNameRequired'))).toBeVisible();
  await expect(page.getByText(cat(en, 'StudentWizardSchema.guardianPhoneRequired'))).toBeVisible();
  await expect(page.getByText(cat(en, 'StudentWizardSchema.guardianEmailRequired'))).toBeVisible();
  await expect(page.getByLabel(cat(en, 'StudentWizard.guardian.name'))).toBeFocused();
  // Still on step 3 (radiogroup still present, not advanced)
  await expect(group).toBeVisible();

  // Valid fill → advances to step 4 (media)
  const nameInput = page.getByLabel(cat(en, 'StudentWizard.guardian.name'));
  const phoneInput = page.getByLabel(cat(en, 'StudentWizard.guardian.phone'));
  await nameInput.fill('Wei Chen');
  await phoneInput.fill('+44 7700 900000');
  await page.getByLabel(cat(en, 'StudentWizard.guardian.email')).fill('wei.chen@example.com');
  await expect(nameInput).toHaveValue('Wei Chen');
  await expect(phoneInput).toHaveValue('+44 7700 900000');
  await phoneInput.blur();
  await page.getByRole('button', { name: cat(en, 'StudentWizard.continue') }).click();
  // The portal wizard prints the step position TWICE (spec 03 §2.3 + §2.9): the
  // card's sub-line "Step 4 of 5 · Optional photo…" and the footer's bare counter.
  // `exact` pins the assertion to the footer counter instead of matching both.
  await expect(page.getByText('Step 4 of 5', { exact: true })).toBeVisible();
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
