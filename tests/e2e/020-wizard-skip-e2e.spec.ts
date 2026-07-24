import path from 'node:path';

import { expect, test } from '@playwright/test';

import { loginAsParent } from './helpers/auth';
import { cat, loadMessages } from './helpers/i18n';
import { fillEducationStep, fillPersonalStep, wizardContinue, wizardRail } from './helpers/wizard-fill';

// Task 005 evidence — wizard step GATING driven through the real UI on :3110 with
// the seeded parent account (creates no student: the walk stops at step 3).
// Every step is now gated: Continue runs form.trigger on the current step's
// fields and only advances when valid, and the rail disables every step past the
// furthest validly reached one (maxReached). This spec INVERTS the old 020
// "skip freely" assertions — the flow they pinned was the bug.
const en = loadMessages('en');
const SCREENSHOTS = path.resolve(process.cwd(), '..', '.qa', 'screenshots');

test.describe.configure({ mode: 'serial' });

test('wizard gates every step: Continue validates, the rail locks steps past the furthest valid one', async ({
  page,
}) => {
  const unique = `Gate-${Date.now().toString(36)}`;

  await loginAsParent(page);
  await page.goto('/dashboard/children/new');

  const personalHeading = page.getByRole('heading', {
    name: cat(en, 'StudentWizard.steps.personal.title'),
  });
  const educationHeading = page.getByRole('heading', {
    name: cat(en, 'StudentWizard.steps.education.title'),
  });
  const guardianHeading = page.getByRole('heading', {
    name: cat(en, 'StudentWizard.steps.guardian.title'),
  });
  await expect(personalHeading).toBeVisible();

  const railButtons = wizardRail(page, en).getByRole('button');

  // Mission flow, part 1 — BEFORE step 1 is valid, steps 2–5 cannot be
  // accessed: each rail button past step 1 renders disabled + aria-disabled.
  await expect(railButtons.nth(0)).toBeEnabled();
  for (const index of [1, 2, 3, 4]) {
    await expect(railButtons.nth(index)).toBeDisabled();
    await expect(railButtons.nth(index)).toHaveAttribute('aria-disabled', 'true');
  }
  await page.screenshot({ path: path.join(SCREENSHOTS, '020-gating-step1-locked.png'), fullPage: true });

  // Continue on empty step 1 does NOT advance: still on step 1, and every
  // mandatory step-1 field reports its own validation error.
  await wizardContinue(page, en);
  await expect(personalHeading).toBeVisible();
  for (const key of [
    'givenNameRequired',
    'familyNameRequired',
    'emailRequired',
    'dobRequired',
    'genderRequired',
    'nationalityRequired',
    'passportRequired',
  ]) {
    await expect(page.getByText(cat(en, `StudentWizardSchema.${key}`))).toBeVisible();
  }
  await expect(railButtons.nth(1)).toBeDisabled();
  await page.screenshot({ path: path.join(SCREENSHOTS, '020-gating-step1-errors.png'), fullPage: true });

  // Fill step 1 VALIDLY → Continue advances to step 2; the rail unlocks step 2
  // while step 3 (and beyond) stays locked.
  await fillPersonalStep(page, en, { givenName: unique });
  await wizardContinue(page, en);
  await expect(educationHeading).toBeVisible();
  await expect(railButtons.nth(1)).toBeEnabled();
  await expect(railButtons.nth(1)).not.toHaveAttribute('aria-disabled', 'true');
  await expect(railButtons.nth(2)).toBeDisabled();
  await expect(railButtons.nth(3)).toBeDisabled();
  await expect(railButtons.nth(4)).toBeDisabled();

  // The gate holds on step 2 as well: Continue on the untouched step shows its
  // own required errors and does not advance (year_level stays optional, so it
  // is NOT among them).
  await wizardContinue(page, en);
  await expect(educationHeading).toBeVisible();
  await expect(page.getByText(cat(en, 'StudentWizardSchema.currentSchoolRequired'))).toBeVisible();
  await expect(
    page.getByText(cat(en, 'StudentWizardSchema.currentYearLevelRequired')),
  ).toBeVisible();
  await expect(page.getByText(cat(en, 'StudentWizardSchema.targetYearRequired'))).toBeVisible();
  await expect(page.getByText(cat(en, 'StudentWizardSchema.termRequired'))).toBeVisible();
  await expect(page.getByText(cat(en, 'StudentWizardSchema.yearLevelInvalid'))).toHaveCount(0);
  await expect(railButtons.nth(2)).toBeDisabled();

  // Valid step 2 → step 3 unlocks; step 4 stays locked.
  await fillEducationStep(page, en);
  await wizardContinue(page, en);
  await expect(guardianHeading).toBeVisible();
  await expect(railButtons.nth(2)).toBeEnabled();
  await expect(railButtons.nth(3)).toBeDisabled();

  // The rail still jumps BACK freely to any reached step.
  await railButtons.nth(0).click();
  await expect(personalHeading).toBeVisible();
  await page.screenshot({ path: path.join(SCREENSHOTS, '020-gating-back-jump.png'), fullPage: true });
});
