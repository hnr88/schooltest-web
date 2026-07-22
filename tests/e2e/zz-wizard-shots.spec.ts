import path from 'node:path';

import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import { loginAsParent } from './helpers/auth';
import { cat, icu, loadMessages } from './helpers/i18n';
import { deleteStudents } from './helpers/student-cleanup';

// Screenshot harness for the redesigned add-child wizard (spec 03 §2). Creates no
// student — it never presses the confirm button.
const en = loadMessages('en');
const SHOTS = path.resolve(process.cwd(), '.qa', 'screenshots');

async function shot(page: Page, name: string) {
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
}

async function fillStep1(page: Page) {
  await page.getByLabel(cat(en, 'StudentWizard.personal.givenName')).fill('Minh');
  await page.getByLabel(cat(en, 'StudentWizard.personal.familyName')).fill('Nguyen');
  await page.getByLabel(cat(en, 'StudentWizard.personal.dateOfBirth')).fill('2013-03-14');
  await page.getByRole('combobox', { name: cat(en, 'StudentWizard.personal.nationality') }).click();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await page
    .getByRole('radiogroup', { name: cat(en, 'StudentWizard.personal.gender.label') })
    .getByRole('radio', { name: cat(en, 'StudentWizard.personal.gender.male'), exact: true })
    .click();
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
  await page.getByRole('button', { name: cat(en, 'StudentWizard.continue'), exact: true }).click();
  await shot(page, 'wizard-1280-step2');

  await page.getByRole('combobox', { name: cat(en, 'StudentWizard.education.yearLevel') }).click();
  await page.getByRole('option', { name: icu(cat(en, 'StudentWizard.education.yearOption'), { n: '7' }), exact: true }).click();
  await page
    .getByRole('combobox', { name: cat(en, 'StudentWizard.education.targetEntryYear') })
    .click();
  await page.getByRole('option').first().click();
  await page
    .getByRole('radiogroup', { name: cat(en, 'StudentWizard.education.targetEntryTerm') })
    .getByRole('radio', { name: icu(cat(en, 'StudentWizard.education.term'), { n: '1' }) })
    .click();
  await page.getByRole('button', { name: cat(en, 'StudentWizard.continue'), exact: true }).click();
  await shot(page, 'wizard-1280-step3');

  await page.getByLabel(cat(en, 'StudentWizard.guardian.name')).fill('Maria Rodriguez');
  const phone = page.getByLabel(cat(en, 'StudentWizard.guardian.phone'));
  await phone.fill('0400 000 000');
  await phone.blur();
  await page.getByRole('button', { name: cat(en, 'StudentWizard.continue'), exact: true }).click();
  await expect(page.getByText(cat(en, 'StudentWizard.media.photo.dropTitle'))).toBeVisible();
  await shot(page, 'wizard-1280-step4');

  await page.getByRole('button', { name: cat(en, 'StudentWizard.continue'), exact: true }).click();
  await expect(page.getByText(cat(en, 'StudentWizard.review.noPhoto'), { exact: false })).toBeVisible();
  await shot(page, 'wizard-1280-step5');

  // Validation path: an empty required field on step 1 renders the portal error line.
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/dashboard/children/new');
  await expect(page.getByRole('heading', { name: cat(en, 'StudentWizard.pageTitle') })).toBeVisible();
  await shot(page, 'wizard-375-step1');
  await page.getByRole('button', { name: cat(en, 'StudentWizard.continue'), exact: true }).click();
  await expect(page.getByText(cat(en, 'StudentWizardSchema.givenNameRequired'))).toBeVisible();
  await shot(page, 'wizard-375-step1-errors');

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, 'horizontal overflow at 375').toBeLessThanOrEqual(0);

  await fillStep1(page);
  await page.getByRole('button', { name: cat(en, 'StudentWizard.continue'), exact: true }).click();
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
    await page.getByRole('button', { name: cat(en, 'StudentWizard.continue'), exact: true }).click();
    await page
      .getByRole('combobox', { name: cat(en, 'StudentWizard.education.targetEntryYear') })
      .click();
    await page.getByRole('option').first().click();
    await page
      .getByRole('radiogroup', { name: cat(en, 'StudentWizard.education.targetEntryTerm') })
      .getByRole('radio', { name: icu(cat(en, 'StudentWizard.education.term'), { n: '1' }) })
      .click();
    await page.getByRole('button', { name: cat(en, 'StudentWizard.continue'), exact: true }).click();
    await page.getByLabel(cat(en, 'StudentWizard.guardian.name')).fill('Maria Rodriguez');
    const phone = page.getByLabel(cat(en, 'StudentWizard.guardian.phone'));
    await phone.fill('0400 000 000');
    await phone.blur();
    await page.getByRole('button', { name: cat(en, 'StudentWizard.continue'), exact: true }).click();
    await page.getByRole('button', { name: cat(en, 'StudentWizard.continue'), exact: true }).click();

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
