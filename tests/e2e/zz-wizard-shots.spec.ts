import path from 'node:path';

import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import { loginAsParent } from './helpers/auth';
import { cat, loadMessages } from './helpers/i18n';
import { deleteStudents } from './helpers/student-cleanup';
import {
  attachWizardPhoto,
  attachWizardVoice,
  fillEducationStep,
  fillGuardianStep,
  fillPersonalStep,
  wizardContinue,
} from './helpers/wizard-fill';

// Screenshot harness for the redesigned add-child wizard (spec 03 §2). The first
// test creates no student — it never presses the confirm button. Every step is
// gated and every field mandatory (task 005), so the walk fills each step
// VALIDLY via the shared helpers; the step-4 shot now also pins the mandatory
// media gate (Continue without uploads is blocked with both required errors).
const en = loadMessages('en');
const SHOTS = path.resolve(process.cwd(), '.qa', 'screenshots');

async function shot(page: Page, name: string) {
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
}

async function fillStep1(page: Page) {
  await fillPersonalStep(page, en, {
    givenName: 'Minh',
    familyName: 'Nguyen',
    dob: '2013-03-14',
    gender: 'male',
  });
}

test('wizard shots', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1280, height: 900 });
  await loginAsParent(page);
  await page.goto('/dashboard/children/new');
  await expect(page.getByRole('heading', { name: cat(en, 'StudentWizard.pageTitle') })).toBeVisible();
  await shot(page, 'wizard-1280-step1');

  const axe = await new AxeBuilder({ page }).analyze();
  const blockers = axe.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  );
  expect(
    blockers.map(
      (violation) => `${violation.id} → ${violation.nodes.map((node) => node.target).join(' | ')}`,
    ),
  ).toEqual([]);

  await fillStep1(page);
  await wizardContinue(page, en);
  await shot(page, 'wizard-1280-step2');

  await fillEducationStep(page, en, { yearLevel: 7 });
  await wizardContinue(page, en);
  await shot(page, 'wizard-1280-step3');

  await fillGuardianStep(page, en, { name: 'Maria Rodriguez', phone: '0400 000 000' });
  await wizardContinue(page, en);
  await expect(page.getByText(cat(en, 'StudentWizard.media.photo.dropTitle'))).toBeVisible();
  await shot(page, 'wizard-1280-step4');

  // Both uploads are mandatory: Continue without them is blocked with the two
  // required errors under their dropzones — the step-5 shot needs real files.
  await wizardContinue(page, en);
  await expect(page.locator('#wizard-photo-error')).toHaveText(
    cat(en, 'StudentWizardSchema.photoRequired'),
  );
  await expect(page.locator('#wizard-voice-intro-error')).toHaveText(
    cat(en, 'StudentWizardSchema.voiceIntroRequired'),
  );
  await attachWizardPhoto(page, en);
  await attachWizardVoice(page, en);
  await wizardContinue(page, en);
  await expect(
    page.getByRole('heading', { name: cat(en, 'StudentWizard.steps.review.title') }),
  ).toBeVisible();
  await shot(page, 'wizard-1280-step5');

  // Validation path: an empty required field on step 1 renders the portal error line.
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/dashboard/children/new');
  await expect(page.getByRole('heading', { name: cat(en, 'StudentWizard.pageTitle') })).toBeVisible();
  await shot(page, 'wizard-375-step1');
  await wizardContinue(page, en);
  await expect(page.getByText(cat(en, 'StudentWizardSchema.givenNameRequired'))).toBeVisible();
  await shot(page, 'wizard-375-step1-errors');

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, 'horizontal overflow at 375').toBeLessThanOrEqual(0);

  await fillStep1(page);
  await wizardContinue(page, en);
  await shot(page, 'wizard-375-step2');
});

// The submit confirmation is a real POST, so the child it creates is deleted again.
test('wizard success panel', async ({ page, request }) => {
  test.setTimeout(180_000);
  const created: string[] = [];
  try {
    await page.setViewportSize({ width: 1280, height: 900 });
    await loginAsParent(page);
    await page.goto('/dashboard/children/new');
    await fillStep1(page);
    await wizardContinue(page, en);
    await fillEducationStep(page, en);
    await wizardContinue(page, en);
    await fillGuardianStep(page, en, { name: 'Maria Rodriguez', phone: '0400 000 000' });
    await wizardContinue(page, en);
    await attachWizardPhoto(page, en);
    await attachWizardVoice(page, en);
    await wizardContinue(page, en);

    const response = page.waitForResponse(
      (res) => res.url().includes('/api/students') && res.request().method() === 'POST',
    );
    await page
      .getByRole('button', { name: cat(en, 'StudentWizard.createStudent'), exact: true })
      .click();
    const createdStudent = await response;
    created.push(((await createdStudent.json()) as { data: { documentId: string } }).data.documentId);

    await expect(page.getByRole('status')).toContainText(
      cat(en, 'StudentWizard.success.createdTitle'),
    );
    // Between the 200ms pop-in settling and the 1100ms hand-off to the roster.
    await page.waitForTimeout(350);
    await page.screenshot({ path: path.join(SHOTS, 'wizard-1280-success.png'), fullPage: true });
    await expect(page).toHaveURL(/\/dashboard\/children$/);
  } finally {
    await deleteStudents(request, created);
  }
});
