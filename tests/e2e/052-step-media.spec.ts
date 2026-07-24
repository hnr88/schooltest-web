import path from 'node:path';

import { expect, type APIRequestContext, type Page, test } from '@playwright/test';

import { deleteAuthEmailRows } from './helpers/auth-db';
import { cat, loadMessages, type AnyLocale, type Messages } from './helpers/i18n';
import { loginParentJwt, registerAndConfirmParent, skipOnboarding } from './helpers/throwaway-parent';
import { waitForAnimationsSettled, watchErrors } from './helpers/ui';
import {
  PNG_1PX,
  fillEducationStep,
  fillGuardianStep,
  fillPersonalStep,
  gotoNewChildWizard,
  wavBuffer,
  wizardContinue,
} from './helpers/wizard-fill';

// Task 052 evidence — Step 4 Media (MediaUpload) driven through the REAL wizard on
// :3110 with a throwaway parent JWT (never the seeded parent). Uploads hit the REAL
// C-UPLOAD-PARENT POST /api/upload; error paths (invalid-type / too-large) must fire
// NO request. Emails are cleaned up in afterAll.
const en = loadMessages('en');
const EVIDENCE = path.resolve(process.cwd(), '..', '.qa', 'evidence');
const usedEmails: string[] = [];

test.describe.configure({ mode: 'serial' });

async function authAndGoto(page: Page, request: APIRequestContext) {
  const parent = await registerAndConfirmParent(request, 'step-media');
  usedEmails.push(parent.email);
  const jwt = await loginParentJwt(request, parent);
  // Fresh parents start onboarding-pending; the dashboard guard would redirect
  // /dashboard/* to /onboarding, so resolve it through the real endpoint first.
  await skipOnboarding(request, jwt);
  await page.addInitScript((token) => {
    window.localStorage.setItem('app.auth.token', token);
  }, jwt);
}

// Steps 1–3 are gated and every field is mandatory (task 005) — reaching step 4
// means filling each earlier step VALIDLY via the shared helpers.
async function fillToStep4(page: Page, m: Messages, locale: AnyLocale = 'en') {
  await gotoNewChildWizard(page, locale);
  await fillPersonalStep(page, m);
  await wizardContinue(page, m);
  await fillEducationStep(page, m);
  await wizardContinue(page, m);
  await fillGuardianStep(page, m);
  await wizardContinue(page, m);
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
