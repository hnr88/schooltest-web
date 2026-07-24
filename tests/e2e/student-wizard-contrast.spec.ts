import { expect, type Locator, type Page, test } from '@playwright/test';

import { loginAsParent } from './helpers/auth';
import { cat, icu, loadMessages } from './helpers/i18n';
import { deleteStudents } from './helpers/student-cleanup';
import { watchErrors } from './helpers/ui';
import {
  attachWizardPhoto,
  attachWizardVoice,
  fillGuardianStep,
  selectRadioChip,
  wizardContinue,
} from './helpers/wizard-fill';

const en = loadMessages('en');

function contrastRatio(first: number[], second: number[]): number {
  const luminance = (channels: number[]) => {
    const linear = channels.map((channel) => {
      const value = channel / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  };

  const [lighter, darker] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

async function expectReadableOption(option: Locator) {
  const colors = await option.evaluate((element) => {
    const style = getComputedStyle(element);
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas color conversion is unavailable');
    const toSrgb = (color: string) => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      return Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3);
    };
    return { background: toSrgb(style.backgroundColor), foreground: toSrgb(style.color) };
  });
  expect(contrastRatio(colors.background, colors.foreground)).toBeGreaterThanOrEqual(4.5);
}

async function chooseFirstOption(page: Page, label: string) {
  await page.getByRole('combobox', { name: label }).click();
  await page.keyboard.press('ArrowDown');
  const highlighted = page.locator('[role="option"][data-highlighted]').first();
  await expect(highlighted).toBeVisible();
  await expectReadableOption(highlighted);
  await page.keyboard.press('Enter');
}

test('student wizard options remain readable and a selected student persists after reload', async ({
  page,
  request,
}) => {
  const errors = watchErrors(page);
  const suffix = String(Date.now()).slice(-7);
  const familyName = `Contrast${suffix}`;
  // The wizard runs as the SEEDED parent, so the child it creates joins the roster
  // dashboard/settings assert on — delete it again in the `finally` (test hygiene).
  const created: string[] = [];
  try {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await loginAsParent(page);
    await page.goto('/dashboard/children/new');

    const nationality = cat(en, 'StudentWizard.personal.nationality');
    await chooseFirstOption(page, nationality);
    await page.getByRole('combobox', { name: nationality }).click();
    const selectedNationality = page.locator('[role="option"][data-selected]').first();
    await expect(selectedNationality).toBeVisible();
    await expectReadableOption(selectedNationality);
    await page.keyboard.press('Escape');

    // Every step-1 field is mandatory (task 005): the two contrast-measured
    // interactions above covered nationality; the rest are filled here.
    await page.getByLabel(cat(en, 'StudentWizard.personal.givenName')).fill('Contrast');
    await page.getByLabel(cat(en, 'StudentWizard.personal.familyName')).fill(familyName);
    await page.getByLabel(cat(en, 'StudentWizard.personal.dateOfBirth')).fill('2014-05-20');
    await page.getByLabel(cat(en, 'StudentWizard.personal.email')).fill('contrast@example.com');
    await selectRadioChip(
      page.getByRole('radiogroup', { name: cat(en, 'StudentWizard.personal.gender.label') }),
      cat(en, 'StudentWizard.personal.gender.female'),
    );
    await page.getByLabel(cat(en, 'StudentWizard.personal.passportNumber')).fill('E12345678');
    await wizardContinue(page, en);

    // Step 2 — current school + current year level are mandatory too.
    await page
      .getByLabel(cat(en, 'StudentWizard.education.currentSchool'))
      .fill('Oakwood Primary');
    await page
      .getByRole('combobox', { name: cat(en, 'StudentWizard.education.currentYearLevel') })
      .click();
    await page.getByRole('option').first().click();
    await chooseFirstOption(page, cat(en, 'StudentWizard.education.targetEntryYear'));
    // Term is now the canonical pill radiogroup (a required answer, not a view
    // switcher) — same field label, same localized option, stronger role assertion.
    await selectRadioChip(
      page.getByRole('radiogroup', { name: cat(en, 'StudentWizard.education.targetEntryTerm') }),
      icu(cat(en, 'StudentWizard.education.term'), { n: '1' }),
    );
    await wizardContinue(page, en);
    await fillGuardianStep(page, en, { name: 'Contrast Guardian', phone: '+61400000000' });
    await wizardContinue(page, en);
    // Step 4 is gated on the two MANDATORY uploads — real files, real uploads.
    await attachWizardPhoto(page, en);
    await attachWizardVoice(page, en);
    await wizardContinue(page, en);

    const createResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/api/students') && response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: cat(en, 'StudentWizard.createStudent') }).click();
    const createdStudent = await createResponse;
    expect(createdStudent.status()).toBe(200);
    created.push(
      ((await createdStudent.json()) as { data: { documentId: string } }).data.documentId,
    );
    await expect(page).toHaveURL(/\/dashboard\/children$/);
    await expect(
      page.getByRole('article', { name: new RegExp(`Contrast ${familyName}`) }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole('article', { name: new RegExp(`Contrast ${familyName}`) }),
    ).toBeVisible();

    expect(errors, errors.join('\n')).toEqual([]);
  } finally {
    await deleteStudents(request, created);
  }
});
