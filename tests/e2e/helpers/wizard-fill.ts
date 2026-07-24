/**
 * Shared wizard-fill helpers (task 005) — since the last wizard commit EVERY
 * step is gated (`Continue` runs form.trigger on the step's fields) and every
 * rendered field is mandatory except year_level / parent_guardian_wechat, any
 * spec that walks past step 1 must fill every earlier step validly. These
 * helpers are the ONE place that knowledge lives; label lookups stay
 * catalog-driven (helpers/i18n) so a copy change fails loud, never silently.
 *
 * Media helpers upload REAL files through the real POST /api/upload (the
 * 1px PNG / empty-WAV mechanism 052 established) — no mocks, no route stubs.
 */
import { expect, type Locator, type Page } from '@playwright/test';

import { cat, icu, type AnyLocale, type Messages } from './i18n';

/**
 * Click a chip-radio until RHF actually holds the selection. A plain click can
 * be SWALLOWED when the previous field's blur fires an async revalidation that
 * re-renders the chip row between mousedown and mouseup (observed live: the
 * chip takes focus but aria-checked stays false) — so click, then verify.
 */
export async function selectRadioChip(group: Locator, name: string): Promise<void> {
  const chip = group.getByRole('radio', { name, exact: true });
  await expect(async () => {
    if ((await chip.getAttribute('aria-checked')) !== 'true') {
      await chip.click();
    }
    await expect(chip).toHaveAttribute('aria-checked', 'true', { timeout: 1000 });
  }).toPass();
}



/**
 * Open a wizard Select and pick an option (the FIRST one when `optionLabel` is
 * omitted). The first-option path is keyboard-driven (ArrowDown + Enter)
 * because a mouse click on the option can be swallowed by the same
 * blur-revalidation race as the chips. "Did it work" is verified by the
 * TRIGGER'S VALUE (chosen label shown / placeholder gone), never by the
 * listbox closing — a swallowed click can still close the popup (outside
 * pointerdown) with nothing selected, which is exactly the flake this guard
 * exists to catch. The base-ui trigger does NOT flip aria-expanded, so it
 * cannot be used for verification either.
 */
async function pickSelectOption(page: Page, m: Messages, labelKey: string, optionLabel?: string): Promise<void> {
  const combo = page.getByRole('combobox', { name: cat(m, labelKey) });
  const listbox = page.getByRole('listbox');
  await expect(async () => {
    if (!(await listbox.isVisible().catch(() => false))) {
      await combo.click();
    }
    if (optionLabel === undefined) {
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      await expect(combo).not.toContainText(cat(m, `${labelKey}Placeholder`), { timeout: 500 });
    } else {
      await page.getByRole('option', { name: optionLabel, exact: true }).click();
      await expect(combo).toContainText(optionLabel, { timeout: 500 });
    }
  }).toPass({ timeout: 10_000 });
}

/** Smallest real PNG (1×1) — passes the image gate, uploads in milliseconds. */
export const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

/** Smallest real WAV (44-byte header, zero data frames) — passes the audio gate. */
export function wavBuffer(): Buffer {
  const b = Buffer.alloc(44);
  b.write('RIFF', 0);
  b.writeUInt32LE(36, 4);
  b.write('WAVE', 8);
  b.write('fmt ', 12);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22);
  b.writeUInt32LE(8000, 24);
  b.writeUInt32LE(8000, 28);
  b.writeUInt16LE(1, 32);
  b.writeUInt16LE(8, 34);
  b.write('data', 36);
  b.writeUInt32LE(0, 40);
  return b;
}

export interface PersonalStepOverrides {
  givenName?: string;
  familyName?: string;
  email?: string;
  dob?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  passport?: string;
}

export interface GuardianStepOverrides {
  name?: string;
  phone?: string;
  email?: string;
}

/** Locale-aware navigation to the add-child wizard. */
export async function gotoNewChildWizard(page: Page, locale: AnyLocale = 'en'): Promise<void> {
  await page.goto(locale === 'en' ? '/dashboard/children/new' : `/${locale}/dashboard/children/new`);
}

/** The footer Continue pill (exact — the review step's confirm is a different label). */
export async function wizardContinue(page: Page, m: Messages): Promise<void> {
  await page.getByRole('button', { name: cat(m, 'StudentWizard.continue'), exact: true }).click();
}

/** The left step rail nav; its buttons gate on maxReached (locked = disabled). */
export function wizardRail(page: Page, m: Messages) {
  return page.getByRole('navigation', { name: cat(m, 'StudentWizard.stepsLabel') });
}

/**
 * Step 1 — Personal, filled VALID end to end (all seven fields mandatory):
 * given/family names, dob (native date input, ISO), email, gender radio,
 * nationality combobox first option, passport number.
 */
export async function fillPersonalStep(
  page: Page,
  m: Messages,
  overrides: PersonalStepOverrides = {},
): Promise<void> {
  await page.getByLabel(cat(m, 'StudentWizard.personal.givenName')).fill(overrides.givenName ?? 'Mia');
  await page
    .getByLabel(cat(m, 'StudentWizard.personal.familyName'))
    .fill(overrides.familyName ?? 'Chen');
  await page
    .getByLabel(cat(m, 'StudentWizard.personal.dateOfBirth'))
    .fill(overrides.dob ?? '2014-05-20');
  await page
    .getByLabel(cat(m, 'StudentWizard.personal.email'))
    .fill(overrides.email ?? 'mia.chen@example.com');
  await selectRadioChip(
    page.getByRole('radiogroup', { name: cat(m, 'StudentWizard.personal.gender.label') }),
    cat(m, `StudentWizard.personal.gender.${overrides.gender ?? 'female'}`),
  );
  await page.getByRole('combobox', { name: cat(m, 'StudentWizard.personal.nationality') }).click();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await page
    .getByLabel(cat(m, 'StudentWizard.personal.passportNumber'))
    .fill(overrides.passport ?? 'E12345678');
}

/**
 * Step 2 — Education, filled VALID: current school text, current year level
 * (first option), target entry year (first option), target entry term (Term 1
 * radio). year_level stays optional — pass `yearLevel` to also pick a band.
 */
export async function fillEducationStep(
  page: Page,
  m: Messages,
  options: { yearLevel?: number } = {},
): Promise<void> {
  await page
    .getByLabel(cat(m, 'StudentWizard.education.currentSchool'))
    .fill('Oakwood Primary');
  await pickSelectOption(page, m, 'StudentWizard.education.currentYearLevel');
  if (options.yearLevel !== undefined) {
    await pickSelectOption(
      page,
      m,
      'StudentWizard.education.yearLevel',
      icu(cat(m, 'StudentWizard.education.yearOption'), { n: String(options.yearLevel) }),
    );
  }
  await pickSelectOption(page, m, 'StudentWizard.education.targetEntryYear');
  await selectRadioChip(
    page.getByRole('radiogroup', { name: cat(m, 'StudentWizard.education.targetEntryTerm') }),
    icu(cat(m, 'StudentWizard.education.term'), { n: '1' }),
  );
}

/** Step 3 — Guardian, filled VALID (name/phone/email mandatory, wechat optional). */
export async function fillGuardianStep(
  page: Page,
  m: Messages,
  overrides: GuardianStepOverrides = {},
): Promise<void> {
  await page
    .getByLabel(cat(m, 'StudentWizard.guardian.name'))
    .fill(overrides.name ?? 'Wei Chen');
  const phone = page.getByLabel(cat(m, 'StudentWizard.guardian.phone'));
  await phone.fill(overrides.phone ?? '+44 7700 900000');
  await phone.blur();
  await page
    .getByLabel(cat(m, 'StudentWizard.guardian.email'))
    .fill(overrides.email ?? 'guardian@example.com');
}

/**
 * Attach the real 1×1 PNG to the photo dropzone: waits for the real
 * POST /api/upload 201 AND the preview (RHF value committed) before returning.
 */
export async function attachWizardPhoto(page: Page, m: Messages): Promise<void> {
  const [uploadRes] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('/api/upload') && r.request().method() === 'POST'),
    page.locator('#wizard-photo').setInputFiles({
      name: 'face.png',
      mimeType: 'image/png',
      buffer: PNG_1PX,
    }),
  ]);
  expect(uploadRes.status()).toBe(201);
  await expect(page.getByAltText(cat(m, 'StudentWizard.media.photo.previewAlt'))).toBeVisible();
}

/** Attach the real empty WAV to the voice dropzone (201 + audio preview). */
export async function attachWizardVoice(page: Page, m: Messages): Promise<void> {
  const [uploadRes] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('/api/upload') && r.request().method() === 'POST'),
    page.locator('#wizard-voice-intro').setInputFiles({
      name: 'intro.wav',
      mimeType: 'audio/wav',
      buffer: wavBuffer(),
    }),
  ]);
  expect(uploadRes.status()).toBe(201);
  await expect(page.locator('audio')).toBeVisible();
}
