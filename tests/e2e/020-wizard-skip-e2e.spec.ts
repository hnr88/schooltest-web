import path from 'node:path';

import { expect, test } from '@playwright/test';

import { loginAsParent } from './helpers/auth';
import { cat, icu, loadMessages } from './helpers/i18n';

// Task 020 evidence — end-to-end wizard skip flow driven through the real UI on
// :3110 with the seeded parent account. Proves that steps can be skipped freely,
// full validation only runs on review submit, and a valid submission creates a
// student that survives a page reload.
const en = loadMessages('en');
const SCREENSHOTS = path.resolve(process.cwd(), '..', '.qa', 'screenshots');

test.describe.configure({ mode: 'serial' });

test('parent can skip wizard steps, final submit validates, and created student persists', async ({
  page,
}) => {
  const unique = `Skip-${Date.now().toString(36)}`;

  // 1. Sign in as the seeded parent and start "Add child" from the sidebar.
  await loginAsParent(page);
  await page.getByRole('link', { name: cat(en, 'Shell.nav.myChildren') }).click();
  await page.waitForURL('**/dashboard/children');
  await page.getByRole('link', { name: cat(en, 'Children.addChild') }).click();
  await page.waitForURL('**/dashboard/children/new');
  await expect(
    page.getByRole('heading', { name: cat(en, 'StudentWizard.steps.personal.title') }),
  ).toBeVisible();
  await page.screenshot({ path: path.join(SCREENSHOTS, '020-wizard-start.png'), fullPage: true });

  // 2. Click Continue on step 1 without filling required fields → should still advance.
  await page.getByRole('button', { name: cat(en, 'StudentWizard.continue'), exact: true }).click();
  await expect(
    page.getByRole('heading', { name: cat(en, 'StudentWizard.steps.education.title') }),
  ).toBeVisible();

  // 3. Skip straight to the review step via the step rail.
  const rail = page.getByRole('navigation', { name: cat(en, 'StudentWizard.stepsLabel') });
  // The rail button's accessible name concatenates number, title and hint; target
  // the fifth (review) button directly to avoid brittle title matching.
  await rail.getByRole('button').nth(4).click();
  await expect(
    page.getByRole('heading', { name: cat(en, 'StudentWizard.steps.review.title') }),
  ).toBeVisible();
  await page.screenshot({ path: path.join(SCREENSHOTS, '020-wizard-review-empty.png'), fullPage: true });

  // 4. Submit from review with invalid data → jump to first invalid step and show Zod errors.
  await page.getByRole('button', { name: cat(en, 'StudentWizard.createStudent'), exact: true }).click();
  await expect(
    page.getByRole('heading', { name: cat(en, 'StudentWizard.steps.personal.title') }),
  ).toBeVisible();
  await expect(page.getByText(cat(en, 'StudentWizardSchema.givenNameRequired'))).toBeVisible();
  await expect(page.getByText(cat(en, 'StudentWizardSchema.nationalityRequired'))).toBeVisible();
  await page.screenshot({ path: path.join(SCREENSHOTS, '020-wizard-step1-errors.png'), fullPage: true });

  // 5. Fill valid data step-by-step and reach review again.
  await page.getByLabel(cat(en, 'StudentWizard.personal.givenName')).fill(unique);
  await page.getByLabel(cat(en, 'StudentWizard.personal.familyName')).fill('E2E');
  await page.getByRole('combobox', { name: cat(en, 'StudentWizard.personal.nationality') }).click();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: cat(en, 'StudentWizard.continue'), exact: true }).click();

  // Step 2 — Education.
  await expect(
    page.getByRole('heading', { name: cat(en, 'StudentWizard.steps.education.title') }),
  ).toBeVisible();
  await page
    .getByRole('combobox', { name: cat(en, 'StudentWizard.education.targetEntryYear') })
    .click();
  await page.getByRole('option').first().click();
  await page
    .getByRole('radiogroup', { name: cat(en, 'StudentWizard.education.targetEntryTerm') })
    .getByRole('radio', { name: icu(cat(en, 'StudentWizard.education.term'), { n: '1' }) })
    .click();
  await page.getByRole('button', { name: cat(en, 'StudentWizard.continue'), exact: true }).click();

  // Step 3 — Guardian.
  await expect(
    page.getByRole('heading', { name: cat(en, 'StudentWizard.steps.guardian.title') }),
  ).toBeVisible();
  await page.getByLabel(cat(en, 'StudentWizard.guardian.name')).fill('E2E Guardian');
  await page.getByLabel(cat(en, 'StudentWizard.guardian.phone')).fill('+61 400 000 000');
  await page.getByRole('button', { name: cat(en, 'StudentWizard.continue'), exact: true }).click();

  // Step 4 — Media (optional), skip to review.
  await expect(
    page.getByRole('heading', { name: cat(en, 'StudentWizard.steps.media.title') }),
  ).toBeVisible();
  await page.getByRole('button', { name: cat(en, 'StudentWizard.continue'), exact: true }).click();

  // Step 5 — Review & confirm.
  await expect(
    page.getByRole('heading', { name: cat(en, 'StudentWizard.steps.review.title') }),
  ).toBeVisible();
  await expect(page.getByText(unique)).toBeVisible();
  await page.screenshot({ path: path.join(SCREENSHOTS, '020-wizard-review-filled.png'), fullPage: true });

  // 6. Submit the valid wizard → land back on /dashboard/children.
  await page.getByRole('button', { name: cat(en, 'StudentWizard.createStudent'), exact: true }).click();
  await page.waitForURL('**/dashboard/children');
  await expect(page.getByRole('heading', { name: cat(en, 'Children.heading') })).toBeVisible();
  await expect(page.getByText(unique)).toBeVisible();

  // 7. Reload and prove persistence.
  await page.reload();
  await expect(page.getByRole('heading', { name: cat(en, 'Children.heading') })).toBeVisible();
  await expect(page.getByText(unique)).toBeVisible();
  await page.screenshot({ path: path.join(SCREENSHOTS, '020-wizard-persisted.png'), fullPage: true });
});
