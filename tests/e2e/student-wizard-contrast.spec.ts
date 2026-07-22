import { expect, type Locator, type Page, test } from '@playwright/test';

import { loginAsParent } from './helpers/auth';
import { cat, icu, loadMessages } from './helpers/i18n';
import { deleteStudents } from './helpers/student-cleanup';
import { watchErrors } from './helpers/ui';

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

    await page.getByLabel(cat(en, 'StudentWizard.personal.givenName')).fill('Contrast');
    await page.getByLabel(cat(en, 'StudentWizard.personal.familyName')).fill(familyName);
    await page.getByRole('button', { name: cat(en, 'StudentWizard.continue') }).click();

    await chooseFirstOption(page, cat(en, 'StudentWizard.education.targetEntryYear'));
    await page
      .getByRole('group', { name: cat(en, 'StudentWizard.education.targetEntryTerm') })
      .getByText(icu(cat(en, 'StudentWizard.education.term'), { n: '1' }), { exact: true })
      .click();
    await page.getByRole('button', { name: cat(en, 'StudentWizard.continue') }).click();
    await page.getByLabel(cat(en, 'StudentWizard.guardian.name')).fill('Contrast Guardian');
    await page.getByLabel(cat(en, 'StudentWizard.guardian.phone')).fill('+61400000000');
    await page.getByRole('button', { name: cat(en, 'StudentWizard.continue') }).click();
    await page.getByRole('button', { name: cat(en, 'StudentWizard.continue') }).click();

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
      page.getByRole('row', { name: new RegExp(`Contrast ${familyName}`) }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole('row', { name: new RegExp(`Contrast ${familyName}`) }),
    ).toBeVisible();

    expect(errors, errors.join('\n')).toEqual([]);
  } finally {
    await deleteStudents(request, created);
  }
});
