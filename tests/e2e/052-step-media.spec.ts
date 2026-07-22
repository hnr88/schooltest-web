import path from 'node:path';

import { expect, type APIRequestContext, type Page, test } from '@playwright/test';

import { deleteAuthEmailRows } from './helpers/auth-db';
import { cat, icu, loadMessages, type AnyLocale, type Messages } from './helpers/i18n';
import { loginParentJwt, registerAndConfirmParent } from './helpers/throwaway-parent';
import { waitForAnimationsSettled, watchErrors } from './helpers/ui';

// Task 052 evidence — Step 4 Media (MediaUpload) driven through the REAL wizard on
// :3100 with a throwaway parent JWT (never the seeded parent). Uploads hit the REAL
// C-UPLOAD-PARENT POST /api/upload; error paths (invalid-type / too-large) must fire
// NO request. Emails are cleaned up in afterAll.
const en = loadMessages('en');
const EVIDENCE = path.resolve(process.cwd(), '..', '.qa', 'evidence');
const usedEmails: string[] = [];

const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

function wavBuffer(): Buffer {
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

test.describe.configure({ mode: 'serial' });

async function authAndGoto(page: Page, request: APIRequestContext) {
  const parent = await registerAndConfirmParent(request, 'step-media');
  usedEmails.push(parent.email);
  const jwt = await loginParentJwt(request, parent);
  await page.addInitScript((token) => {
    window.localStorage.setItem('app.auth.token', token);
  }, jwt);
}

async function fillToStep4(page: Page, m: Messages, locale: AnyLocale = 'en') {
  await page.goto(
    locale === 'en' ? '/dashboard/children/new' : `/${locale}/dashboard/children/new`,
  );
  await page.getByLabel(cat(m, 'StudentWizard.personal.givenName')).fill('Mia');
  await page.getByLabel(cat(m, 'StudentWizard.personal.familyName')).fill('Chen');
  await page.getByRole('combobox', { name: cat(m, 'StudentWizard.personal.nationality') }).click();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: cat(m, 'StudentWizard.continue') }).click();
  await page
    .getByRole('combobox', { name: cat(m, 'StudentWizard.education.targetEntryYear') })
    .click();
  await page.getByRole('option').first().click();
  // Term is now the canonical pill radiogroup (a required answer, not a view
  // switcher) — same field label, same localized option, stronger role assertion.
  await page
    .getByRole('radiogroup', { name: cat(m, 'StudentWizard.education.targetEntryTerm') })
    .getByRole('radio', { name: icu(cat(m, 'StudentWizard.education.term'), { n: '1' }) })
    .click();
  await page.getByRole('button', { name: cat(m, 'StudentWizard.continue') }).click();
  await page.getByLabel(cat(m, 'StudentWizard.guardian.name')).fill('Wei Chen');
  const phone = page.getByLabel(cat(m, 'StudentWizard.guardian.phone'));
  await phone.fill('+44 7700 900000');
  await phone.blur();
  await page.getByRole('button', { name: cat(m, 'StudentWizard.continue') }).click();
  // Locale-safe step-4 confirmation: the photo dropzone copy is unique to StepMedia.
  await expect(page.getByText(cat(m, 'StudentWizard.media.photo.dropTitle'))).toBeVisible();
}

test('EN: step 4 media — client gate blocks bad files, real upload previews, remove, voice', async ({
  page,
  request,
}) => {
  const errors = watchErrors(page);
  let uploadRequests = 0;
  page.on('request', (req) => {
    if (req.method() === 'POST' && req.url().includes('/api/upload')) uploadRequests += 1;
  });

  await authAndGoto(page, request);
  await fillToStep4(page, en);

  // Both dropzones present
  await expect(page.getByText(cat(en, 'StudentWizard.media.photo.dropTitle'))).toBeVisible();
  await expect(page.getByText(cat(en, 'StudentWizard.media.voice.dropTitle'))).toBeVisible();

  const photoInput = page.locator('#wizard-photo');

  // Invalid type on the photo field → inline error, NO request
  await photoInput.setInputFiles({
    name: 'notes.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('x'),
  });
  await expect(page.getByText(cat(en, 'StudentWizard.media.photo.invalidType'))).toBeVisible();

  // 16MB image → too-large inline error, NO request
  await photoInput.setInputFiles({
    name: 'huge.png',
    mimeType: 'image/png',
    buffer: Buffer.alloc(16 * 1024 * 1024),
  });
  await expect(page.getByText(cat(en, 'StudentWizard.media.photo.tooLarge'))).toBeVisible();
  expect(uploadRequests).toBe(0);

  // Valid PNG → real POST /api/upload 201, bare array, numeric [0].id
  const [uploadRes] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('/api/upload') && r.request().method() === 'POST'),
    photoInput.setInputFiles({ name: 'face.png', mimeType: 'image/png', buffer: PNG_1PX }),
  ]);
  expect(uploadRes.status()).toBe(201);
  const body = (await uploadRes.json()) as Array<{ id: number }>;
  expect(Array.isArray(body)).toBe(true);
  expect(typeof body[0].id).toBe('number');

  const preview = page.getByAltText(cat(en, 'StudentWizard.media.photo.previewAlt'));
  await expect(preview).toBeVisible();
  await expect(
    page.getByRole('button', { name: cat(en, 'StudentWizard.media.remove') }),
  ).toBeVisible();

  // Absolutized preview url serves 200 (relative /uploads/* would 404 on the web origin)
  const src = await preview.getAttribute('src');
  expect(src).toContain('/uploads/');
  const served = await request.get(src as string);
  expect(served.status()).toBe(200);

  await waitForAnimationsSettled(page);
  await page.screenshot({ path: path.join(EVIDENCE, '052-step4-preview.png'), fullPage: true });

  // Remove → preview clears, dropzone returns
  await page.getByRole('button', { name: cat(en, 'StudentWizard.media.remove') }).click();
  await expect(preview).toHaveCount(0);
  await expect(page.getByText(cat(en, 'StudentWizard.media.photo.dropTitle'))).toBeVisible();

  // Voice field accepts a wav → real upload + audio player preview
  await Promise.all([
    page.waitForResponse((r) => r.url().includes('/api/upload') && r.request().method() === 'POST'),
    page.locator('#wizard-voice-intro').setInputFiles({
      name: 'intro.wav',
      mimeType: 'audio/wav',
      buffer: wavBuffer(),
    }),
  ]);
  await expect(page.locator('audio')).toBeVisible();

  expect(errors).toEqual([]);
});

test('ZH: step 4 renders localized media copy', async ({ page, request }) => {
  const zh = loadMessages('zh' as AnyLocale);
  await authAndGoto(page, request);
  await fillToStep4(page, zh, 'zh');
  await expect(page.getByText(cat(zh, 'StudentWizard.media.photo.helper'))).toBeVisible();
  await expect(page.getByText(cat(zh, 'StudentWizard.media.voice.dropTitle'))).toBeVisible();
  await waitForAnimationsSettled(page);
  await page.screenshot({ path: path.join(EVIDENCE, '052-step4-zh.png'), fullPage: true });
});

test.afterAll(() => {
  for (const email of usedEmails) {
    deleteAuthEmailRows(email);
  }
});
